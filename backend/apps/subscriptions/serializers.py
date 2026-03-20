from rest_framework import serializers
from .models import Subscription, SubscriptionSkip, SubscriptionOrder


class SubscriptionListSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.kitchen_name', read_only=True)
    seller_slug = serializers.CharField(source='seller.slug', read_only=True)
    seller_logo = serializers.ImageField(source='seller.logo', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    plan_name = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            'id', 'subscription_id', 'status', 'start_date', 'end_date',
            'total_days', 'remaining_days', 'total_amount',
            'skips_used', 'max_skips', 'pauses_used', 'max_pauses',
            'seller', 'seller_name', 'seller_slug', 'seller_logo',
            'customer', 'customer_name', 'plan_name',
            'created_at',
        ]

    def get_plan_name(self, obj):
        return obj.plan_snapshot.get('name', '')


class SubscriptionDetailSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.kitchen_name', read_only=True)
    seller_slug = serializers.CharField(source='seller.slug', read_only=True)
    seller_logo = serializers.ImageField(source='seller.logo', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'subscription_id', 'status', 'start_date', 'end_date',
            'total_days', 'remaining_days', 'total_amount',
            'skips_used', 'max_skips', 'pauses_used', 'max_pauses',
            'is_auto_renew', 'plan_snapshot', 'delivery_address',
            'pause_start_date', 'pause_end_date',
            'seller', 'seller_name', 'seller_slug', 'seller_logo',
            'customer', 'customer_name', 'customer_phone',
            'created_at', 'updated_at',
        ]


class SubscriptionSkipSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionSkip
        fields = ['id', 'skip_date', 'reason', 'refund_amount', 'is_refunded', 'created_at']


class SubscriptionOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionOrder
        fields = ['id', 'date', 'meal_type', 'status', 'created_at']


class CreateSubscriptionSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    address_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=['online', 'wallet'])
    start_date = serializers.DateField(required=False)


class SkipDateSerializer(serializers.Serializer):
    date = serializers.DateField()
    reason = serializers.CharField(required=False, default='', allow_blank=True)
