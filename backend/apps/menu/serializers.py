from rest_framework import serializers
from django.utils.text import slugify

from .models import Category, MenuItem, SubscriptionPlan, SubscriptionPlanItem


class CategorySerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'is_active', 'display_order', 'items_count']
        read_only_fields = ['slug']

    def get_items_count(self, obj):
        return obj.items.filter(is_active=True, is_available=True).count()

    def create(self, validated_data):
        validated_data['slug'] = slugify(validated_data['name'])
        return super().create(validated_data)


# --- Menu Items ---

class MenuItemListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing"""
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    effective_price = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    seller_name = serializers.CharField(source='seller.kitchen_name', read_only=True)
    seller_slug = serializers.CharField(source='seller.slug', read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'slug', 'image', 'price', 'discounted_price',
            'effective_price', 'meal_type', 'food_type', 'is_available',
            'category', 'category_name', 'seller', 'seller_name', 'seller_slug',
            'preparation_time_mins', 'calories', 'serves',
        ]


class MenuItemDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    effective_price = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    seller_name = serializers.CharField(source='seller.kitchen_name', read_only=True)
    seller_slug = serializers.CharField(source='seller.slug', read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'slug', 'description', 'image', 'price',
            'discounted_price', 'effective_price', 'meal_type', 'food_type',
            'is_available', 'is_active', 'category', 'category_name',
            'seller', 'seller_name', 'seller_slug',
            'preparation_time_mins', 'calories', 'serves',
            'created_at', 'updated_at',
        ]


class SellerMenuItemSerializer(serializers.ModelSerializer):
    """For seller CRUD - auto-sets seller"""
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    effective_price = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'slug', 'description', 'image', 'price',
            'discounted_price', 'effective_price', 'meal_type', 'food_type',
            'is_available', 'is_active', 'category', 'category_name',
            'preparation_time_mins', 'calories', 'serves',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['slug']

    def create(self, validated_data):
        seller = self.context['request'].user.seller_profile
        validated_data['seller'] = seller
        # Generate unique slug
        base_slug = slugify(validated_data['name'])
        slug = base_slug
        counter = 1
        while MenuItem.objects.filter(seller=seller, slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        validated_data['slug'] = slug
        return super().create(validated_data)


# --- Subscription Plans ---

class SubscriptionPlanItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)

    class Meta:
        model = SubscriptionPlanItem
        fields = ['id', 'menu_item', 'menu_item_name', 'meal_type', 'is_default']


class SubscriptionPlanListSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.kitchen_name', read_only=True)
    seller_slug = serializers.CharField(source='seller.slug', read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'description', 'plan_type', 'duration_days',
            'price', 'daily_price', 'items_per_meal', 'includes_weekends',
            'max_skips_allowed', 'max_pauses_allowed', 'is_active', 'image',
            'seller', 'seller_name', 'seller_slug',
        ]


class SubscriptionPlanDetailSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.kitchen_name', read_only=True)
    seller_slug = serializers.CharField(source='seller.slug', read_only=True)
    plan_items = SubscriptionPlanItemSerializer(many=True, read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'description', 'plan_type', 'duration_days',
            'price', 'daily_price', 'items_per_meal', 'includes_weekends',
            'max_skips_allowed', 'max_pauses_allowed', 'is_active', 'image',
            'seller', 'seller_name', 'seller_slug', 'plan_items',
            'created_at', 'updated_at',
        ]


class SellerSubscriptionPlanSerializer(serializers.ModelSerializer):
    """For seller CRUD"""
    plan_items = SubscriptionPlanItemSerializer(many=True, read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'description', 'plan_type', 'duration_days',
            'price', 'daily_price', 'items_per_meal', 'includes_weekends',
            'max_skips_allowed', 'max_pauses_allowed', 'is_active', 'image',
            'plan_items', 'created_at', 'updated_at',
        ]

    def create(self, validated_data):
        validated_data['seller'] = self.context['request'].user.seller_profile
        return super().create(validated_data)
