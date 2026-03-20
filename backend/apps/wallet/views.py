from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings

from .models import Wallet, WalletTransaction
from .serializers import WalletSerializer, WalletTransactionSerializer, RechargeSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_balance(request):
    """Get current wallet balance."""
    wallet, _ = Wallet.objects.get_or_create(user=request.user)
    serializer = WalletSerializer(wallet)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recharge_wallet(request):
    """Create Razorpay order for wallet recharge."""
    serializer = RechargeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    amount = serializer.validated_data['amount']

    import razorpay
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    razorpay_order = client.order.create({
        'amount': int(amount * 100),  # paise
        'currency': 'INR',
        'payment_capture': 1,
    })

    from apps.payments.models import Payment
    Payment.objects.create(
        user=request.user,
        razorpay_order_id=razorpay_order['id'],
        amount=amount,
        payment_for='wallet_recharge',
    )

    return Response({
        'razorpay_order_id': razorpay_order['id'],
        'amount': int(amount * 100),
        'currency': 'INR',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_money(request):
    """Directly add money to wallet (no payment gateway)."""
    serializer = RechargeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    amount = serializer.validated_data['amount']

    wallet, _ = Wallet.objects.get_or_create(user=request.user)
    wallet.balance += amount
    wallet.save()

    WalletTransaction.objects.create(
        wallet=wallet,
        transaction_type='credit',
        amount=amount,
        balance_after=wallet.balance,
        reason='recharge',
        description=f'Wallet recharge of ₹{amount}',
    )

    return Response({
        'detail': f'₹{amount} added to wallet successfully.',
        'balance': float(wallet.balance),
    })


class TransactionListView(generics.ListAPIView):
    """List wallet transactions with pagination."""
    serializer_class = WalletTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        wallet, _ = Wallet.objects.get_or_create(user=self.request.user)
        qs = WalletTransaction.objects.filter(wallet=wallet).order_by('-created_at')

        # Filter by transaction type
        tx_type = self.request.query_params.get('type')
        if tx_type in ('credit', 'debit'):
            qs = qs.filter(transaction_type=tx_type)

        # Filter by reason
        reason = self.request.query_params.get('reason')
        if reason:
            qs = qs.filter(reason=reason)

        return qs
