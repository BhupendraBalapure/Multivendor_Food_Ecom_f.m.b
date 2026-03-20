import razorpay
from decimal import Decimal
from django.conf import settings
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Payment
from .serializers import PaymentSerializer, CreateRazorpayOrderSerializer, VerifyPaymentSerializer
from apps.orders.models import Order


def get_razorpay_client():
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_razorpay_order(request):
    """Create a Razorpay order for payment"""
    serializer = CreateRazorpayOrderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    amount = data['amount']
    payment_for = data['payment_for']

    # Link to order if applicable
    order_obj = None
    if payment_for == 'order' and data.get('order_id'):
        try:
            order_obj = Order.objects.get(id=data['order_id'], customer=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_400_BAD_REQUEST)

    # Create Razorpay order
    client = get_razorpay_client()
    razorpay_amount = int(amount * 100)  # Razorpay uses paise

    try:
        rz_order = client.order.create({
            'amount': razorpay_amount,
            'currency': 'INR',
            'payment_capture': 1,
        })
    except Exception as e:
        return Response({'detail': f'Razorpay error: {str(e)}'}, status=status.HTTP_502_BAD_GATEWAY)

    # Save payment record
    payment = Payment.objects.create(
        user=request.user,
        razorpay_order_id=rz_order['id'],
        amount=amount,
        payment_for=payment_for,
        order=order_obj,
        status='initiated',
    )

    return Response({
        'payment_id': payment.payment_id,
        'razorpay_order_id': rz_order['id'],
        'razorpay_key_id': settings.RAZORPAY_KEY_ID,
        'amount': razorpay_amount,
        'currency': 'INR',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """Verify Razorpay payment after frontend modal"""
    serializer = VerifyPaymentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        payment = Payment.objects.get(
            razorpay_order_id=data['razorpay_order_id'],
            user=request.user,
        )
    except Payment.DoesNotExist:
        return Response({'detail': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Verify signature
    client = get_razorpay_client()
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': data['razorpay_order_id'],
            'razorpay_payment_id': data['razorpay_payment_id'],
            'razorpay_signature': data['razorpay_signature'],
        })
    except razorpay.errors.SignatureVerificationError:
        payment.status = 'failed'
        payment.save(update_fields=['status'])
        return Response({'detail': 'Payment verification failed.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        payment.razorpay_payment_id = data['razorpay_payment_id']
        payment.razorpay_signature = data['razorpay_signature']
        payment.status = 'success'
        payment.save()

        # Mark order as paid
        if payment.order:
            payment.order.is_paid = True
            payment.order.save(update_fields=['is_paid'])

        # Handle wallet recharge
        if payment.payment_for == 'wallet_recharge':
            wallet = request.user.wallet
            wallet.balance += payment.amount
            wallet.save()
            from apps.wallet.models import WalletTransaction
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='credit',
                amount=payment.amount,
                balance_after=wallet.balance,
                reason='recharge',
                reference_id=payment.payment_id,
                description=f'Wallet recharge via Razorpay',
            )

    return Response({
        'detail': 'Payment verified successfully.',
        'payment_id': payment.payment_id,
        'status': payment.status,
    })


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def razorpay_webhook(request):
    """Razorpay webhook for payment events"""
    payload = request.data
    event = payload.get('event')

    if event == 'payment.captured':
        payment_entity = payload.get('payload', {}).get('payment', {}).get('entity', {})
        rz_order_id = payment_entity.get('order_id')
        rz_payment_id = payment_entity.get('id')

        try:
            payment = Payment.objects.get(razorpay_order_id=rz_order_id)
            if payment.status != 'success':
                payment.razorpay_payment_id = rz_payment_id
                payment.status = 'success'
                payment.save()

                if payment.order:
                    payment.order.is_paid = True
                    payment.order.save(update_fields=['is_paid'])
        except Payment.DoesNotExist:
            pass

    return Response({'status': 'ok'})


class PaymentListView(generics.ListAPIView):
    """User: list own payments"""
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).order_by('-created_at')
