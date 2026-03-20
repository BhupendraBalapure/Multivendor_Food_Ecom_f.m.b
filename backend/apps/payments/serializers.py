from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_id', 'razorpay_order_id', 'razorpay_payment_id',
            'amount', 'currency', 'status', 'payment_for',
            'order', 'subscription', 'refund_amount',
            'created_at',
        ]


class CreateRazorpayOrderSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_for = serializers.ChoiceField(choices=['order', 'subscription', 'wallet_recharge'])
    order_id = serializers.IntegerField(required=False)
    subscription_id = serializers.IntegerField(required=False)


class VerifyPaymentSerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField()
