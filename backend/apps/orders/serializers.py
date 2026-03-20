from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory, Review
from apps.menu.models import MenuItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'item_name', 'item_price', 'quantity', 'total_price']
        read_only_fields = ['item_name', 'item_price', 'total_price']


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True, default=None)

    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'from_status', 'to_status', 'changed_by_name', 'note', 'created_at']


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight for listing"""
    items_count = serializers.SerializerMethodField()
    seller_name = serializers.CharField(source='seller.kitchen_name', read_only=True)
    seller_logo = serializers.ImageField(source='seller.logo', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'order_type', 'status', 'total_amount',
            'is_paid', 'payment_method', 'items_count',
            'seller', 'seller_name', 'seller_logo',
            'customer', 'customer_name',
            'created_at',
        ]

    def get_items_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    seller_id = serializers.IntegerField(source='seller.id', read_only=True)
    seller_name = serializers.CharField(source='seller.kitchen_name', read_only=True)
    seller_slug = serializers.CharField(source='seller.slug', read_only=True)
    seller_logo = serializers.ImageField(source='seller.logo', read_only=True)
    seller_phone = serializers.CharField(source='seller.user.phone', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    has_review = serializers.SerializerMethodField()
    review = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'order_type', 'status',
            'subtotal', 'delivery_fee', 'discount', 'total_amount',
            'is_paid', 'payment_method', 'special_instructions',
            'delivery_address_snapshot',
            'scheduled_delivery_time', 'actual_delivery_time',
            'rejection_reason', 'cancellation_reason',
            'seller', 'seller_id', 'seller_name', 'seller_slug', 'seller_logo', 'seller_phone',
            'customer', 'customer_name', 'customer_phone',
            'items', 'status_history', 'has_review', 'review',
            'created_at', 'updated_at',
        ]

    def get_has_review(self, obj):
        try:
            return obj.review is not None
        except Review.DoesNotExist:
            return False

    def get_review(self, obj):
        try:
            return ReviewSerializer(obj.review).data
        except Review.DoesNotExist:
            return None


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'order', 'customer', 'customer_name', 'seller', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'customer', 'customer_name', 'seller', 'created_at']


class CreateReviewSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, default='', allow_blank=True)


class CreateOrderSerializer(serializers.Serializer):
    """Customer creates an order from cart"""
    seller_id = serializers.IntegerField()
    address_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=['online', 'wallet', 'cod'])
    special_instructions = serializers.CharField(required=False, default='', allow_blank=True)
    items = serializers.ListField(child=serializers.DictField(), min_length=1)
    # Each item: { menu_item_id, quantity }

    def validate_items(self, items):
        for item in items:
            if 'menu_item_id' not in item or 'quantity' not in item:
                raise serializers.ValidationError("Each item must have menu_item_id and quantity.")
            if int(item['quantity']) < 1:
                raise serializers.ValidationError("Quantity must be at least 1.")
        return items
