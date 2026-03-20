from rest_framework import serializers
from django.utils.text import slugify

from apps.sellers.models import SellerProfile, SellerOperatingDay
from apps.accounts.serializers import UserSerializer


class SellerOperatingDaySerializer(serializers.ModelSerializer):
    day_name = serializers.SerializerMethodField()

    class Meta:
        model = SellerOperatingDay
        fields = ('id', 'day_of_week', 'day_name', 'is_open')

    def get_day_name(self, obj):
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return days[obj.day_of_week]


class SellerRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = (
            'kitchen_name', 'description', 'logo', 'banner_image',
            'address_line', 'city', 'state', 'pincode',
            'latitude', 'longitude',
            'fssai_license', 'fssai_document',
            'pan_number', 'gst_number',
            'bank_account_number', 'bank_ifsc', 'bank_name',
            'opening_time', 'closing_time',
            'delivery_radius_km', 'minimum_order_amount',
        )

    def validate_kitchen_name(self, value):
        slug = slugify(value)
        if SellerProfile.objects.filter(slug=slug).exists():
            raise serializers.ValidationError('A kitchen with a similar name already exists.')
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['slug'] = slugify(validated_data['kitchen_name'])

        # Update user role to seller
        user.role = 'seller'
        user.save()

        profile = SellerProfile.objects.create(user=user, **validated_data)

        # Create default operating days (Mon-Sat open, Sunday closed)
        for day in range(7):
            SellerOperatingDay.objects.create(
                seller=profile,
                day_of_week=day,
                is_open=(day != 6),  # Sunday closed by default
            )

        return profile


class SellerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    operating_days = SellerOperatingDaySerializer(many=True, read_only=True)
    is_approved = serializers.BooleanField(read_only=True)

    class Meta:
        model = SellerProfile
        fields = (
            'id', 'user', 'kitchen_name', 'slug', 'description',
            'logo', 'banner_image',
            'address_line', 'city', 'state', 'pincode',
            'latitude', 'longitude',
            'fssai_license', 'fssai_document',
            'pan_number', 'gst_number',
            'bank_account_number', 'bank_ifsc', 'bank_name',
            'approval_status', 'rejection_reason',
            'is_online', 'is_accepting_orders',
            'opening_time', 'closing_time',
            'delivery_radius_km', 'minimum_order_amount',
            'average_rating', 'total_ratings',
            'commission_percentage',
            'operating_days', 'is_approved',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'slug', 'approval_status', 'rejection_reason',
            'average_rating', 'total_ratings', 'commission_percentage',
            'created_at', 'updated_at',
        )


class SellerPublicListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for public vendor listing"""
    owner_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = SellerProfile
        fields = (
            'id', 'kitchen_name', 'slug', 'description', 'logo', 'banner_image',
            'city', 'state', 'average_rating', 'total_ratings',
            'is_online', 'opening_time', 'closing_time',
            'delivery_radius_km', 'minimum_order_amount',
            'owner_name',
        )


class SellerPublicDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for public vendor detail page"""
    owner_name = serializers.CharField(source='user.full_name', read_only=True)
    operating_days = SellerOperatingDaySerializer(many=True, read_only=True)

    class Meta:
        model = SellerProfile
        fields = (
            'id', 'kitchen_name', 'slug', 'description', 'logo', 'banner_image',
            'address_line', 'city', 'state', 'pincode',
            'average_rating', 'total_ratings',
            'is_online', 'is_accepting_orders',
            'opening_time', 'closing_time',
            'delivery_radius_km', 'minimum_order_amount',
            'owner_name', 'operating_days',
        )


class AdminSellerActionSerializer(serializers.Serializer):
    """For admin approve/reject/suspend actions"""
    reason = serializers.CharField(required=False, allow_blank=True)
