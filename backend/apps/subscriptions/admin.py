from django.contrib import admin
from .models import Subscription, SubscriptionSkip, SubscriptionOrder


class SubscriptionSkipInline(admin.TabularInline):
    model = SubscriptionSkip
    extra = 0
    readonly_fields = ['skip_date', 'reason', 'refund_amount', 'is_refunded']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['subscription_id', 'customer', 'seller', 'status', 'start_date', 'end_date', 'remaining_days', 'total_amount']
    list_filter = ['status']
    search_fields = ['subscription_id', 'customer__full_name', 'seller__kitchen_name']
    readonly_fields = ['subscription_id']
    inlines = [SubscriptionSkipInline]


@admin.register(SubscriptionOrder)
class SubscriptionOrderAdmin(admin.ModelAdmin):
    list_display = ['subscription', 'date', 'meal_type', 'status']
    list_filter = ['status', 'meal_type', 'date']
    search_fields = ['subscription__subscription_id']
