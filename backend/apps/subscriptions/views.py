from datetime import date, timedelta
from decimal import Decimal
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.permissions import IsCustomer, IsCustomerOrAdmin, IsSeller, IsAdmin
from apps.accounts.models import Address
from apps.menu.models import SubscriptionPlan
from apps.notifications.utils import send_notification

from .models import Subscription, SubscriptionSkip, SubscriptionOrder
from .serializers import (
    SubscriptionListSerializer, SubscriptionDetailSerializer,
    SubscriptionOrderSerializer, SubscriptionSkipSerializer,
    CreateSubscriptionSerializer, SkipDateSerializer,
)


# ========================
# Customer Views
# ========================

class CustomerSubscriptionListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsCustomerOrAdmin]
    serializer_class = SubscriptionListSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_queryset(self):
        return Subscription.objects.filter(
            customer=self.request.user
        ).select_related('seller', 'plan').order_by('-created_at')


class CustomerSubscriptionDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, IsCustomerOrAdmin]
    serializer_class = SubscriptionDetailSerializer

    def get_queryset(self):
        return Subscription.objects.filter(
            customer=self.request.user
        ).select_related('seller', 'customer')


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsCustomerOrAdmin])
def subscribe(request):
    """Customer: subscribe to a plan"""
    serializer = CreateSubscriptionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    # Validate plan
    try:
        plan = SubscriptionPlan.objects.get(
            id=data['plan_id'], is_active=True, seller__approval_status='approved'
        )
    except SubscriptionPlan.DoesNotExist:
        return Response({'detail': 'Plan not found or inactive.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate address
    try:
        address = Address.objects.get(id=data['address_id'], user=request.user)
    except Address.DoesNotExist:
        return Response({'detail': 'Address not found.'}, status=status.HTTP_400_BAD_REQUEST)

    start = data.get('start_date', date.today() + timedelta(days=1))
    if start <= date.today():
        return Response({'detail': 'Start date must be in the future.'}, status=status.HTTP_400_BAD_REQUEST)

    end = start + timedelta(days=plan.duration_days - 1)
    total_amount = plan.price

    # Snapshot the plan details
    plan_snapshot = {
        'name': plan.name,
        'plan_type': plan.plan_type,
        'duration_days': plan.duration_days,
        'price': str(plan.price),
        'daily_price': str(plan.daily_price),
        'items_per_meal': plan.items_per_meal,
        'includes_weekends': plan.includes_weekends,
        'max_skips_allowed': plan.max_skips_allowed,
        'max_pauses_allowed': plan.max_pauses_allowed,
    }

    with transaction.atomic():
        # Wallet payment check + deduction with row lock
        if data['payment_method'] == 'wallet':
            from apps.wallet.models import Wallet, WalletTransaction
            wallet = Wallet.objects.select_for_update().get(user=request.user)
            if wallet.balance < total_amount:
                return Response(
                    {'detail': f'Insufficient wallet balance. Need ₹{total_amount}, have ₹{wallet.balance}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        sub = Subscription.objects.create(
            customer=request.user,
            seller=plan.seller,
            plan=plan,
            plan_snapshot=plan_snapshot,
            start_date=start,
            end_date=end,
            total_days=plan.duration_days,
            remaining_days=plan.duration_days,
            total_amount=total_amount,
            max_skips=plan.max_skips_allowed,
            max_pauses=plan.max_pauses_allowed,
            delivery_address=address,
        )

        # Deduct wallet (already locked above)
        if data['payment_method'] == 'wallet':
            wallet.balance -= total_amount
            wallet.save()
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='debit',
                amount=total_amount,
                balance_after=wallet.balance,
                reason='order_payment',
                reference_id=sub.subscription_id,
                description=f'Subscription {sub.subscription_id} - {plan.name}',
            )

        send_notification(
            user=plan.seller.user,
            notification_type='new_subscription',
            title='New Subscriber!',
            message=f'{request.user.full_name} subscribed to {plan.name}.',
        )

    result = SubscriptionDetailSerializer(sub).data
    return Response(result, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsCustomerOrAdmin])
def skip_date(request, pk):
    """Customer: skip a specific date"""
    serializer = SkipDateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        sub = Subscription.objects.get(pk=pk, customer=request.user)
    except Subscription.DoesNotExist:
        return Response({'detail': 'Subscription not found.'}, status=status.HTTP_404_NOT_FOUND)

    if sub.status != 'active':
        return Response({'detail': 'Can only skip dates on active subscriptions.'}, status=status.HTTP_400_BAD_REQUEST)

    skip_dt = data['date']

    if skip_dt <= date.today():
        return Response({'detail': 'Can only skip future dates.'}, status=status.HTTP_400_BAD_REQUEST)

    if skip_dt < sub.start_date or skip_dt > sub.end_date:
        return Response({'detail': 'Date is outside subscription period.'}, status=status.HTTP_400_BAD_REQUEST)

    if sub.skips_used >= sub.max_skips:
        return Response({'detail': f'Max skips ({sub.max_skips}) already used.'}, status=status.HTTP_400_BAD_REQUEST)

    if SubscriptionSkip.objects.filter(subscription=sub, skip_date=skip_dt).exists():
        return Response({'detail': 'This date is already skipped.'}, status=status.HTTP_400_BAD_REQUEST)

    daily_price = Decimal(sub.plan_snapshot.get('daily_price', '0'))

    with transaction.atomic():
        SubscriptionSkip.objects.create(
            subscription=sub,
            skip_date=skip_dt,
            reason=data.get('reason', ''),
            refund_amount=daily_price,
            is_refunded=True,
        )
        sub.skips_used += 1
        sub.save(update_fields=['skips_used'])

        # Mark any existing subscription order as skipped
        SubscriptionOrder.objects.filter(
            subscription=sub, date=skip_dt
        ).update(status='skipped')

        # Refund daily price to wallet (with row lock)
        if daily_price > 0:
            from apps.wallet.models import Wallet, WalletTransaction
            wallet = Wallet.objects.select_for_update().get(user=request.user)
            wallet.balance += daily_price
            wallet.save()
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='credit',
                amount=daily_price,
                balance_after=wallet.balance,
                reason='subscription_refund',
                reference_id=sub.subscription_id,
                description=f'Skip refund for {skip_dt}',
            )

    return Response({'detail': f'Date {skip_dt} skipped. ₹{daily_price} refunded to wallet.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsCustomerOrAdmin])
def pause_subscription(request, pk):
    """Customer: pause subscription"""
    try:
        sub = Subscription.objects.get(pk=pk, customer=request.user)
    except Subscription.DoesNotExist:
        return Response({'detail': 'Subscription not found.'}, status=status.HTTP_404_NOT_FOUND)

    if sub.status != 'active':
        return Response({'detail': 'Can only pause active subscriptions.'}, status=status.HTTP_400_BAD_REQUEST)

    if sub.pauses_used >= sub.max_pauses:
        return Response({'detail': f'Max pauses ({sub.max_pauses}) already used.'}, status=status.HTTP_400_BAD_REQUEST)

    sub.status = 'paused'
    sub.pause_start_date = date.today()
    sub.pauses_used += 1
    sub.save(update_fields=['status', 'pause_start_date', 'pauses_used'])

    send_notification(
        user=sub.seller.user,
        notification_type='subscription_paused',
        title='Subscription Paused',
        message=f'{request.user.full_name} paused their subscription {sub.subscription_id}.',
    )

    return Response({'detail': 'Subscription paused.', 'status': sub.status})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsCustomerOrAdmin])
def resume_subscription(request, pk):
    """Customer: resume paused subscription"""
    try:
        sub = Subscription.objects.get(pk=pk, customer=request.user)
    except Subscription.DoesNotExist:
        return Response({'detail': 'Subscription not found.'}, status=status.HTTP_404_NOT_FOUND)

    if sub.status != 'paused':
        return Response({'detail': 'Subscription is not paused.'}, status=status.HTTP_400_BAD_REQUEST)

    sub.status = 'active'
    sub.pause_end_date = date.today()
    sub.save(update_fields=['status', 'pause_end_date'])

    send_notification(
        user=sub.seller.user,
        notification_type='subscription_resumed',
        title='Subscription Resumed',
        message=f'{request.user.full_name} resumed their subscription {sub.subscription_id}.',
    )

    return Response({'detail': 'Subscription resumed.', 'status': sub.status})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsCustomerOrAdmin])
def cancel_subscription(request, pk):
    """Customer: cancel subscription with prorated refund"""
    try:
        sub = Subscription.objects.get(pk=pk, customer=request.user)
    except Subscription.DoesNotExist:
        return Response({'detail': 'Subscription not found.'}, status=status.HTTP_404_NOT_FOUND)

    if sub.status not in ('active', 'paused'):
        return Response({'detail': 'Cannot cancel this subscription.'}, status=status.HTTP_400_BAD_REQUEST)

    daily_price = Decimal(sub.plan_snapshot.get('daily_price', '0'))
    refund_amount = daily_price * sub.remaining_days

    with transaction.atomic():
        sub.status = 'cancelled'
        sub.save(update_fields=['status'])

        # Cancel future subscription orders
        SubscriptionOrder.objects.filter(
            subscription=sub, date__gt=date.today(), status='generated'
        ).update(status='cancelled')

        # Prorated refund (with row lock)
        if refund_amount > 0:
            from apps.wallet.models import Wallet, WalletTransaction
            wallet = Wallet.objects.select_for_update().get(user=request.user)
            wallet.balance += refund_amount
            wallet.save()
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='credit',
                amount=refund_amount,
                balance_after=wallet.balance,
                reason='subscription_refund',
                reference_id=sub.subscription_id,
                description=f'Cancellation refund ({sub.remaining_days} days)',
            )

        send_notification(
            user=sub.seller.user,
            notification_type='subscription_cancelled',
            title='Subscription Cancelled',
            message=f'{request.user.full_name} cancelled subscription {sub.subscription_id}.',
        )

    return Response({
        'detail': f'Subscription cancelled. ₹{refund_amount} refunded to wallet.',
        'refund_amount': str(refund_amount),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsCustomerOrAdmin])
def subscription_calendar(request, pk):
    """Customer: get calendar data for a subscription"""
    try:
        sub = Subscription.objects.get(pk=pk, customer=request.user)
    except Subscription.DoesNotExist:
        return Response({'detail': 'Subscription not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Get all daily orders
    daily_orders = SubscriptionOrder.objects.filter(subscription=sub).order_by('date')
    orders_data = SubscriptionOrderSerializer(daily_orders, many=True).data

    # Get all skips
    skips = SubscriptionSkip.objects.filter(subscription=sub)
    skips_data = SubscriptionSkipSerializer(skips, many=True).data

    return Response({
        'subscription_id': sub.subscription_id,
        'start_date': sub.start_date,
        'end_date': sub.end_date,
        'daily_orders': orders_data,
        'skips': skips_data,
    })


# ========================
# Seller Views
# ========================

class SellerSubscriptionListView(generics.ListAPIView):
    """Seller: list subscriptions for their kitchen"""
    permission_classes = [IsAuthenticated, IsSeller]
    serializer_class = SubscriptionListSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_queryset(self):
        return Subscription.objects.filter(
            seller=self.request.user.seller_profile
        ).select_related('seller', 'customer', 'plan').order_by('-created_at')


class SellerSubscriptionDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, IsSeller]
    serializer_class = SubscriptionDetailSerializer

    def get_queryset(self):
        return Subscription.objects.filter(
            seller=self.request.user.seller_profile
        ).select_related('seller', 'customer')


# ========================
# Admin Views
# ========================

class AdminSubscriptionListView(generics.ListAPIView):
    """Admin: list all subscriptions with filters"""
    permission_classes = [IsAdmin]
    serializer_class = SubscriptionListSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_queryset(self):
        qs = Subscription.objects.select_related('seller', 'customer').order_by('-created_at')
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(subscription_id__icontains=search) |
                Q(customer__full_name__icontains=search) |
                Q(customer__email__icontains=search) |
                Q(seller__kitchen_name__icontains=search)
            )
        return qs


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSeller])
def seller_todays_orders(request):
    """Seller: get today's subscription orders"""
    today = date.today()
    orders = SubscriptionOrder.objects.filter(
        subscription__seller=request.user.seller_profile,
        date=today,
    ).exclude(status='skipped').select_related('subscription__customer')

    data = []
    for order in orders:
        data.append({
            'id': order.id,
            'subscription_id': order.subscription.subscription_id,
            'customer_name': order.subscription.customer.full_name,
            'customer_phone': order.subscription.customer.phone,
            'meal_type': order.meal_type,
            'status': order.status,
            'date': order.date,
        })

    return Response(data)
