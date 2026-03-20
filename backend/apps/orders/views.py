from decimal import Decimal
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.accounts.permissions import IsCustomer, IsCustomerOrAdmin, IsSeller, IsAdmin
from apps.accounts.models import Address
from apps.menu.models import MenuItem
from apps.sellers.models import SellerProfile
from apps.notifications.utils import send_notification

from .models import Order, OrderItem, OrderStatusHistory, Review
from .serializers import (
    OrderListSerializer, OrderDetailSerializer, CreateOrderSerializer,
    ReviewSerializer, CreateReviewSerializer,
)


# ========================
# Customer Views
# ========================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsCustomerOrAdmin])
def customer_dashboard(request):
    """Customer: dashboard stats with recent orders and today's meals."""
    from apps.subscriptions.models import Subscription, SubscriptionOrder
    from apps.wallet.models import Wallet

    user = request.user
    today = timezone.now().date()

    # Active orders (not delivered/cancelled/rejected)
    active_orders = Order.objects.filter(
        customer=user,
        status__in=['pending', 'accepted', 'preparing', 'out_for_delivery']
    ).count()

    total_orders = Order.objects.filter(customer=user).count()

    # Active subscriptions
    active_subs = Subscription.objects.filter(customer=user, status='active').count()

    # Wallet balance
    wallet_balance = 0
    try:
        wallet_balance = float(user.wallet.balance)
    except Exception:
        pass

    # Today's meals (subscription orders for today)
    todays_meals = list(
        SubscriptionOrder.objects.filter(
            subscription__customer=user, date=today
        ).exclude(status='skipped')
        .values('meal_type', 'status', 'subscription__seller__kitchen_name')
    )

    # Recent orders (last 5)
    recent_orders = list(
        Order.objects.filter(customer=user)
        .select_related('seller')
        .order_by('-created_at')[:5]
        .values('id', 'order_id', 'status', 'total_amount', 'created_at',
                'seller__kitchen_name', 'order_type')
    )

    return Response({
        'active_orders': active_orders,
        'total_orders': total_orders,
        'active_subscriptions': active_subs,
        'wallet_balance': wallet_balance,
        'todays_meals': todays_meals,
        'recent_orders': recent_orders,
    })


class CustomerOrderListView(generics.ListAPIView):
    """Customer: list own orders"""
    permission_classes = [IsAuthenticated, IsCustomerOrAdmin]
    serializer_class = OrderListSerializer

    def get_queryset(self):
        qs = Order.objects.filter(
            customer=self.request.user
        ).select_related('seller').prefetch_related('items').order_by('-created_at')
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status__in=status.split(','))
        order_type = self.request.query_params.get('order_type')
        if order_type:
            qs = qs.filter(order_type=order_type)
        return qs


class CustomerOrderDetailView(generics.RetrieveAPIView):
    """Customer: order detail"""
    permission_classes = [IsAuthenticated, IsCustomerOrAdmin]
    serializer_class = OrderDetailSerializer

    def get_queryset(self):
        return Order.objects.filter(
            customer=self.request.user
        ).select_related('seller', 'customer').prefetch_related('items', 'status_history')


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsCustomerOrAdmin])
def create_order(request):
    """Customer: place a new order from cart"""
    serializer = CreateOrderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    # Validate seller
    try:
        seller = SellerProfile.objects.get(id=data['seller_id'], approval_status='approved')
    except SellerProfile.DoesNotExist:
        return Response({'detail': 'Seller not found or not approved.'}, status=status.HTTP_400_BAD_REQUEST)

    if not seller.is_online:
        return Response({'detail': 'Seller is currently offline.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate address
    try:
        address = Address.objects.get(id=data['address_id'], user=request.user)
    except Address.DoesNotExist:
        return Response({'detail': 'Address not found.'}, status=status.HTTP_400_BAD_REQUEST)

    # Build order items and calculate totals
    order_items = []
    subtotal = Decimal('0')

    for item_data in data['items']:
        try:
            menu_item = MenuItem.objects.get(
                id=item_data['menu_item_id'],
                seller=seller,
                is_active=True,
                is_available=True,
            )
        except MenuItem.DoesNotExist:
            return Response(
                {'detail': f'Menu item {item_data["menu_item_id"]} is not available.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qty = int(item_data['quantity'])
        price = menu_item.effective_price
        line_total = price * qty
        subtotal += line_total

        order_items.append({
            'menu_item': menu_item,
            'item_name': menu_item.name,
            'item_price': price,
            'quantity': qty,
            'total_price': line_total,
        })

    # Check minimum order
    if subtotal < seller.minimum_order_amount:
        return Response(
            {'detail': f'Minimum order amount is ₹{seller.minimum_order_amount}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Delivery fee: ₹25 for orders below ₹150
    FREE_DELIVERY_THRESHOLD = Decimal('200')
    DELIVERY_FEE = Decimal('40')
    delivery_fee = DELIVERY_FEE if subtotal < FREE_DELIVERY_THRESHOLD else Decimal('0')
    total_amount = subtotal + delivery_fee

    # Create order (wallet check + deduction inside atomic with select_for_update)
    with transaction.atomic():
        # Wallet payment check with row lock to prevent race conditions
        if data['payment_method'] == 'wallet':
            from apps.wallet.models import Wallet, WalletTransaction
            wallet = Wallet.objects.select_for_update().get(user=request.user)
            if wallet.balance < total_amount:
                return Response(
                    {'detail': f'Insufficient wallet balance. Available: ₹{wallet.balance}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Snapshot the address
        address_snapshot = {
            'full_address': address.full_address,
            'landmark': address.landmark,
            'city': address.city,
            'state': address.state,
            'pincode': address.pincode,
        }

        order = Order.objects.create(
            customer=request.user,
            seller=seller,
            order_type='instant',
            delivery_address=address,
            delivery_address_snapshot=address_snapshot,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            total_amount=total_amount,
            special_instructions=data.get('special_instructions', ''),
            payment_method=data['payment_method'],
            is_paid=(data['payment_method'] == 'wallet'),
        )

        for item in order_items:
            OrderItem.objects.create(order=order, **item)

        # Deduct wallet if wallet payment (wallet already locked above)
        if data['payment_method'] == 'wallet':
            wallet.balance -= total_amount
            wallet.save()
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='debit',
                amount=total_amount,
                balance_after=wallet.balance,
                reason='order_payment',
                reference_id=order.order_id,
                description=f'Payment for order {order.order_id}',
            )

        # Notify seller
        send_notification(
            user=seller.user,
            notification_type='new_order',
            title='New Order Received!',
            message=f'New order #{order.order_id} for ₹{total_amount}.',
        )

    detail_serializer = OrderDetailSerializer(order)
    return Response(detail_serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsCustomerOrAdmin])
def cancel_order(request, pk):
    """Customer: cancel order (only before preparing)"""
    try:
        order = Order.objects.get(pk=pk, customer=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get('reason', '')

    if not order.can_transition_to('cancelled'):
        return Response(
            {'detail': f'Cannot cancel order in "{order.status}" status.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        order.cancellation_reason = reason
        order.transition_to('cancelled', changed_by=request.user, note=reason)

        # Refund to wallet if paid (with row lock)
        if order.is_paid and order.payment_method == 'wallet':
            from apps.wallet.models import Wallet, WalletTransaction
            wallet = Wallet.objects.select_for_update().get(user=request.user)
            wallet.balance += order.total_amount
            wallet.save()
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='credit',
                amount=order.total_amount,
                balance_after=wallet.balance,
                reason='refund',
                reference_id=order.order_id,
                description=f'Refund for cancelled order {order.order_id}',
            )

        send_notification(
            user=order.seller.user,
            notification_type='order_cancelled',
            title='Order Cancelled',
            message=f'Order #{order.order_id} has been cancelled by customer.',
        )

    return Response({'detail': 'Order cancelled successfully.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsCustomerOrAdmin])
def submit_review(request, pk):
    """Customer: review a delivered order"""
    try:
        order = Order.objects.get(pk=pk, customer=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    if order.status != 'delivered':
        return Response({'detail': 'Can only review delivered orders.'}, status=status.HTTP_400_BAD_REQUEST)

    if hasattr(order, 'review'):
        return Response({'detail': 'You have already reviewed this order.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = CreateReviewSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    review = Review.objects.create(
        order=order,
        customer=request.user,
        seller=order.seller,
        rating=serializer.validated_data['rating'],
        comment=serializer.validated_data.get('comment', ''),
    )

    return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def seller_reviews(request, seller_id):
    """Public: get reviews for a seller"""
    reviews = Review.objects.filter(
        seller_id=seller_id
    ).select_related('customer').order_by('-created_at')[:50]
    return Response(ReviewSerializer(reviews, many=True).data)


# ========================
# Seller Views
# ========================

class SellerOrderListView(generics.ListAPIView):
    """Seller: list orders for their kitchen"""
    permission_classes = [IsAuthenticated, IsSeller]
    serializer_class = OrderListSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'order_type']

    def get_queryset(self):
        return Order.objects.filter(
            seller=self.request.user.seller_profile
        ).select_related('seller', 'customer').prefetch_related('items').order_by('-created_at')


class SellerOrderDetailView(generics.RetrieveAPIView):
    """Seller: order detail"""
    permission_classes = [IsAuthenticated, IsSeller]
    serializer_class = OrderDetailSerializer

    def get_queryset(self):
        return Order.objects.filter(
            seller=self.request.user.seller_profile
        ).select_related('seller', 'customer').prefetch_related('items', 'status_history')


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsSeller])
def accept_order(request, pk):
    """Seller: accept a pending order"""
    try:
        order = Order.objects.get(pk=pk, seller=request.user.seller_profile)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not order.can_transition_to('accepted'):
        return Response(
            {'detail': f'Cannot accept order in "{order.status}" status.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    order.transition_to('accepted', changed_by=request.user)

    send_notification(
        user=order.customer,
        notification_type='order_accepted',
        title='Order Accepted!',
        message=f'Your order #{order.order_id} has been accepted and will be prepared soon.',
    )

    return Response({'detail': 'Order accepted.', 'status': order.status})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsSeller])
def reject_order(request, pk):
    """Seller: reject a pending order"""
    try:
        order = Order.objects.get(pk=pk, seller=request.user.seller_profile)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not order.can_transition_to('rejected'):
        return Response(
            {'detail': f'Cannot reject order in "{order.status}" status.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    reason = request.data.get('reason', '')

    with transaction.atomic():
        order.rejection_reason = reason
        order.save(update_fields=['rejection_reason'])
        order.transition_to('rejected', changed_by=request.user, note=reason)

        # Refund to wallet if paid
        if order.is_paid:
            wallet = order.customer.wallet
            wallet.balance += order.total_amount
            wallet.save()
            from apps.wallet.models import WalletTransaction
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='credit',
                amount=order.total_amount,
                balance_after=wallet.balance,
                reason='refund',
                reference_id=order.order_id,
                description=f'Refund for rejected order {order.order_id}',
            )

        send_notification(
            user=order.customer,
            notification_type='order_rejected',
            title='Order Rejected',
            message=f'Your order #{order.order_id} was rejected. {reason}' if reason else f'Your order #{order.order_id} was rejected.',
        )

    return Response({'detail': 'Order rejected.', 'status': order.status})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsSeller])
def update_order_status(request, pk):
    """Seller: update order status (preparing -> out_for_delivery -> delivered)"""
    try:
        order = Order.objects.get(pk=pk, seller=request.user.seller_profile)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if not new_status:
        return Response({'detail': 'Status is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not order.can_transition_to(new_status):
        return Response(
            {'detail': f'Cannot transition from "{order.status}" to "{new_status}".'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    order.transition_to(new_status, changed_by=request.user)

    # Mark as paid on delivery for COD
    if new_status == 'delivered' and order.payment_method == 'cod':
        order.is_paid = True
        order.save(update_fields=['is_paid'])

    status_labels = {
        'preparing': 'is being prepared',
        'out_for_delivery': 'is out for delivery',
        'delivered': 'has been delivered',
    }
    send_notification(
        user=order.customer,
        notification_type='order_status',
        title=f'Order {new_status.replace("_", " ").title()}',
        message=f'Your order #{order.order_id} {status_labels.get(new_status, new_status)}.',
    )

    return Response({'detail': f'Status updated to {new_status}.', 'status': order.status})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSeller])
def seller_add_order_item(request, pk):
    """Seller: add a menu item to an existing order"""
    profile = getattr(request.user, 'seller_profile', None)
    if not profile:
        return Response({'detail': 'Seller profile not found.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        order = Order.objects.get(pk=pk, seller=profile)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    menu_item_id = request.data.get('menu_item_id')
    quantity = int(request.data.get('quantity', 1))

    try:
        menu_item = MenuItem.objects.get(id=menu_item_id, seller=profile)
    except MenuItem.DoesNotExist:
        return Response({'detail': 'Menu item not found.'}, status=status.HTTP_400_BAD_REQUEST)

    price = menu_item.effective_price
    OrderItem.objects.create(
        order=order, menu_item=menu_item, item_name=menu_item.name,
        item_price=price, quantity=quantity, total_price=price * quantity,
    )
    _recalculate_order_totals(order)
    return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsSeller])
def seller_update_order_item(request, pk, item_id):
    """Seller: update quantity of an order item"""
    profile = getattr(request.user, 'seller_profile', None)
    if not profile:
        return Response({'detail': 'Seller profile not found.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        order = Order.objects.get(pk=pk, seller=profile)
        item = OrderItem.objects.get(id=item_id, order=order)
    except (Order.DoesNotExist, OrderItem.DoesNotExist):
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    quantity = int(request.data.get('quantity', item.quantity))
    if quantity < 1:
        return Response({'detail': 'Quantity must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)

    item.quantity = quantity
    item.total_price = item.item_price * quantity
    item.save(update_fields=['quantity', 'total_price'])
    _recalculate_order_totals(order)
    return Response(OrderDetailSerializer(order).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsSeller])
def seller_delete_order_item(request, pk, item_id):
    """Seller: remove an item from an order"""
    profile = getattr(request.user, 'seller_profile', None)
    if not profile:
        return Response({'detail': 'Seller profile not found.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        order = Order.objects.get(pk=pk, seller=profile)
        item = OrderItem.objects.get(id=item_id, order=order)
    except (Order.DoesNotExist, OrderItem.DoesNotExist):
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if order.items.count() <= 1:
        return Response({'detail': 'Cannot remove the last item. Cancel the order instead.'}, status=status.HTTP_400_BAD_REQUEST)

    item.delete()
    _recalculate_order_totals(order)
    return Response(OrderDetailSerializer(order).data)


# ========================
# Admin Views
# ========================

class AdminOrderListView(generics.ListAPIView):
    """Admin: list all orders with filters"""
    permission_classes = [IsAdmin]
    serializer_class = OrderListSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'order_type', 'payment_method', 'is_paid']

    def get_queryset(self):
        qs = Order.objects.select_related('seller', 'customer').prefetch_related('items').order_by('-created_at')
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(order_id__icontains=search) |
                Q(customer__full_name__icontains=search) |
                Q(customer__email__icontains=search) |
                Q(seller__kitchen_name__icontains=search)
            )
        return qs


class AdminOrderDetailView(generics.RetrieveAPIView):
    """Admin: get full order detail"""
    permission_classes = [IsAdmin]
    serializer_class = OrderDetailSerializer

    def get_queryset(self):
        return Order.objects.select_related(
            'seller', 'customer'
        ).prefetch_related('items', 'status_history')


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_update_order_status(request, pk):
    """Admin: force update order status (bypasses transition rules)"""
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    valid_statuses = [s[0] for s in Order.STATUS_CHOICES]
    if new_status not in valid_statuses:
        return Response({'detail': f'Invalid status. Choose from: {valid_statuses}'}, status=status.HTTP_400_BAD_REQUEST)

    if new_status == order.status:
        return Response({'detail': 'Order is already in this status.'}, status=status.HTTP_400_BAD_REQUEST)

    old_status = order.status
    order.status = new_status
    if new_status == 'delivered':
        order.actual_delivery_time = timezone.now()
        if order.payment_method == 'cod':
            order.is_paid = True
    order.save()

    OrderStatusHistory.objects.create(
        order=order,
        from_status=old_status,
        to_status=new_status,
        changed_by=request.user,
        note=f'Status changed by admin',
    )

    return Response(OrderDetailSerializer(order).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_add_order_item(request, pk):
    """Admin: add a menu item to an existing order"""
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    menu_item_id = request.data.get('menu_item_id')
    quantity = int(request.data.get('quantity', 1))

    try:
        menu_item = MenuItem.objects.get(id=menu_item_id, seller=order.seller)
    except MenuItem.DoesNotExist:
        return Response({'detail': 'Menu item not found for this seller.'}, status=status.HTTP_400_BAD_REQUEST)

    price = menu_item.effective_price
    line_total = price * quantity

    OrderItem.objects.create(
        order=order,
        menu_item=menu_item,
        item_name=menu_item.name,
        item_price=price,
        quantity=quantity,
        total_price=line_total,
    )

    # Recalculate totals
    _recalculate_order_totals(order)

    return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_update_order_item(request, pk, item_id):
    """Admin: update quantity of an order item"""
    try:
        order = Order.objects.get(pk=pk)
        item = OrderItem.objects.get(id=item_id, order=order)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
    except OrderItem.DoesNotExist:
        return Response({'detail': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)

    quantity = int(request.data.get('quantity', item.quantity))
    if quantity < 1:
        return Response({'detail': 'Quantity must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)

    item.quantity = quantity
    item.total_price = item.item_price * quantity
    item.save(update_fields=['quantity', 'total_price'])

    _recalculate_order_totals(order)

    return Response(OrderDetailSerializer(order).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_delete_order_item(request, pk, item_id):
    """Admin: remove an item from an order"""
    try:
        order = Order.objects.get(pk=pk)
        item = OrderItem.objects.get(id=item_id, order=order)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
    except OrderItem.DoesNotExist:
        return Response({'detail': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)

    if order.items.count() <= 1:
        return Response({'detail': 'Cannot remove the last item. Cancel the order instead.'}, status=status.HTTP_400_BAD_REQUEST)

    item.delete()

    _recalculate_order_totals(order)

    return Response(OrderDetailSerializer(order).data)


def _recalculate_order_totals(order):
    """Recalculate subtotal, delivery fee, and total for an order."""
    subtotal = sum(i.total_price for i in order.items.all())
    FREE_DELIVERY_THRESHOLD = Decimal('200')
    DELIVERY_FEE = Decimal('40')
    delivery_fee = DELIVERY_FEE if subtotal < FREE_DELIVERY_THRESHOLD else Decimal('0')
    order.subtotal = subtotal
    order.delivery_fee = delivery_fee
    order.total_amount = subtotal + delivery_fee - order.discount
    order.save(update_fields=['subtotal', 'delivery_fee', 'total_amount'])
