import logging
from datetime import date, timedelta
from decimal import Decimal
from celery import shared_task
from django.db import transaction

logger = logging.getLogger(__name__)


@shared_task
def generate_daily_subscription_orders():
    """
    Run daily at 5 AM. For each active subscription:
    1. Check if today is within subscription range
    2. Skip weekends if plan doesn't include them
    3. Skip if date is in SubscriptionSkip
    4. Skip if subscription is paused
    5. Check seller is online -> auto-refund if not
    6. Create SubscriptionOrder (idempotent via unique_together)
    7. Create actual Order with items
    8. Decrement remaining_days, mark expired if 0
    """
    from apps.subscriptions.models import Subscription, SubscriptionSkip, SubscriptionOrder
    from apps.orders.models import Order, OrderItem
    from apps.notifications.utils import send_notification
    from apps.wallet.models import WalletTransaction

    today = date.today()
    day_of_week = today.weekday()  # 0=Monday, 6=Sunday

    active_subs = Subscription.objects.filter(
        status='active',
        start_date__lte=today,
        end_date__gte=today,
    ).select_related('customer', 'seller', 'seller__user', 'plan', 'delivery_address')

    generated = 0
    skipped = 0
    errors = 0

    for sub in active_subs:
        try:
            plan_snapshot = sub.plan_snapshot
            includes_weekends = plan_snapshot.get('includes_weekends', True)

            # Skip weekends if not included
            if not includes_weekends and day_of_week >= 5:
                logger.info(f"Skipping {sub.subscription_id}: weekend excluded")
                skipped += 1
                continue

            # Skip if date is in skip list
            if SubscriptionSkip.objects.filter(subscription=sub, skip_date=today).exists():
                logger.info(f"Skipping {sub.subscription_id}: date skipped by customer")
                skipped += 1
                continue

            # Check if seller is online and operates today
            seller = sub.seller
            operates_today = seller.operating_days.filter(
                day_of_week=day_of_week, is_open=True
            ).exists()

            if not operates_today or not seller.is_online:
                # Auto-refund for this day
                daily_price = Decimal(plan_snapshot.get('daily_price', '0'))
                if daily_price > 0:
                    with transaction.atomic():
                        wallet = sub.customer.wallet
                        wallet.balance += daily_price
                        wallet.save()
                        WalletTransaction.objects.create(
                            wallet=wallet,
                            transaction_type='credit',
                            amount=daily_price,
                            balance_after=wallet.balance,
                            reason='subscription_refund',
                            reference_id=sub.subscription_id,
                            description=f'Auto-refund: seller offline/closed on {today}',
                        )

                    send_notification(
                        user=sub.customer,
                        notification_type='subscription_refund',
                        title='Meal Refunded',
                        message=f'₹{daily_price} refunded - {seller.kitchen_name} is not available today.',
                    )
                logger.info(f"Refunded {sub.subscription_id}: seller offline/closed")
                skipped += 1
                continue

            # Determine meal types from plan
            plan_type = plan_snapshot.get('plan_type', 'lunch')
            meal_types = []
            if plan_type == 'breakfast':
                meal_types = ['breakfast']
            elif plan_type == 'lunch':
                meal_types = ['lunch']
            elif plan_type == 'dinner':
                meal_types = ['dinner']
            elif plan_type == 'lunch_dinner':
                meal_types = ['lunch', 'dinner']
            elif plan_type == 'all_meals':
                meal_types = ['breakfast', 'lunch', 'dinner']

            for meal_type in meal_types:
                # Idempotency check (unique_together)
                if SubscriptionOrder.objects.filter(
                    subscription=sub, date=today, meal_type=meal_type
                ).exists():
                    logger.info(f"Already exists: {sub.subscription_id} {today} {meal_type}")
                    continue

                with transaction.atomic():
                    # Create SubscriptionOrder
                    sub_order = SubscriptionOrder.objects.create(
                        subscription=sub,
                        date=today,
                        meal_type=meal_type,
                        status='generated',
                    )

                    # Create actual Order
                    address = sub.delivery_address
                    address_snapshot = {}
                    if address:
                        address_snapshot = {
                            'full_address': address.full_address,
                            'landmark': address.landmark,
                            'city': address.city,
                            'state': address.state,
                            'pincode': address.pincode,
                        }

                    daily_price = Decimal(plan_snapshot.get('daily_price', '0'))

                    order = Order.objects.create(
                        customer=sub.customer,
                        seller=seller,
                        order_type='subscription',
                        delivery_address=address,
                        delivery_address_snapshot=address_snapshot,
                        subtotal=daily_price,
                        total_amount=daily_price,
                        is_paid=True,
                        payment_method='wallet',
                        subscription_order=sub_order,
                    )

                    # Add a generic order item
                    OrderItem.objects.create(
                        order=order,
                        item_name=f'{meal_type.capitalize()} - {plan_snapshot.get("name", "Subscription")}',
                        item_price=daily_price,
                        quantity=1,
                        total_price=daily_price,
                    )

                    # Notify seller
                    send_notification(
                        user=seller.user,
                        notification_type='subscription_order',
                        title=f'Subscription {meal_type.capitalize()}',
                        message=f'{sub.customer.full_name} - {meal_type} order for today.',
                    )

                generated += 1

            # Decrement remaining days
            sub.remaining_days = max(0, sub.remaining_days - 1)
            if sub.remaining_days == 0:
                sub.status = 'expired'
                send_notification(
                    user=sub.customer,
                    notification_type='subscription_expired',
                    title='Subscription Expired',
                    message=f'Your subscription {sub.subscription_id} has expired.',
                )
            sub.save(update_fields=['remaining_days', 'status'])

        except Exception as e:
            logger.error(f"Error processing {sub.subscription_id}: {e}")
            errors += 1

    logger.info(f"Daily orders: generated={generated}, skipped={skipped}, errors={errors}")
    return f"Generated: {generated}, Skipped: {skipped}, Errors: {errors}"


@shared_task
def check_expired_subscriptions():
    """Mark subscriptions as expired if end_date has passed."""
    from apps.subscriptions.models import Subscription
    from apps.notifications.utils import send_notification

    today = date.today()
    expired = Subscription.objects.filter(
        status='active',
        end_date__lt=today,
    )

    count = 0
    for sub in expired:
        sub.status = 'expired'
        sub.remaining_days = 0
        sub.save(update_fields=['status', 'remaining_days'])
        send_notification(
            user=sub.customer,
            notification_type='subscription_expired',
            title='Subscription Expired',
            message=f'Your subscription {sub.subscription_id} has expired.',
        )
        count += 1

    logger.info(f"Expired {count} subscriptions")
    return f"Expired: {count}"


@shared_task
def auto_reject_stale_orders():
    """Auto-reject orders not accepted within time limit."""
    from apps.orders.models import Order
    from apps.notifications.utils import send_notification
    from django.utils import timezone

    cutoff_instant = timezone.now() - timedelta(minutes=15)
    cutoff_subscription = timezone.now() - timedelta(minutes=30)

    # Instant orders older than 15 min
    stale_instant = Order.objects.filter(
        status='pending',
        order_type='instant',
        created_at__lt=cutoff_instant,
    )

    # Subscription orders older than 30 min
    stale_sub = Order.objects.filter(
        status='pending',
        order_type='subscription',
        created_at__lt=cutoff_subscription,
    )

    count = 0
    for order in list(stale_instant) + list(stale_sub):
        try:
            with transaction.atomic():
                order.rejection_reason = 'Auto-rejected: not accepted in time'
                order.save(update_fields=['rejection_reason'])
                order.transition_to('rejected', note='Auto-rejected by system')

                # Refund if paid
                if order.is_paid:
                    from apps.wallet.models import WalletTransaction
                    wallet = order.customer.wallet
                    wallet.balance += order.total_amount
                    wallet.save()
                    WalletTransaction.objects.create(
                        wallet=wallet,
                        transaction_type='credit',
                        amount=order.total_amount,
                        balance_after=wallet.balance,
                        reason='refund',
                        reference_id=order.order_id,
                        description=f'Auto-reject refund for {order.order_id}',
                    )

                send_notification(
                    user=order.customer,
                    notification_type='order_rejected',
                    title='Order Auto-Rejected',
                    message=f'Order #{order.order_id} was not accepted in time and has been cancelled. Refund processed.',
                )
                count += 1
        except Exception as e:
            logger.error(f"Auto-reject error for {order.order_id}: {e}")

    logger.info(f"Auto-rejected {count} stale orders")
    return f"Auto-rejected: {count}"
