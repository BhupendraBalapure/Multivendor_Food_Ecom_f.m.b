from django.contrib import admin
from apps.sellers.models import SellerProfile, SellerOperatingDay


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ('kitchen_name', 'user', 'city', 'approval_status', 'is_online', 'created_at')
    list_filter = ('approval_status', 'is_online', 'city')
    search_fields = ('kitchen_name', 'user__full_name', 'user__email', 'city')
    readonly_fields = ('slug', 'average_rating', 'total_ratings')


@admin.register(SellerOperatingDay)
class SellerOperatingDayAdmin(admin.ModelAdmin):
    list_display = ('seller', 'day_of_week', 'is_open')
    list_filter = ('is_open',)
