from django.contrib import admin
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['menu_item', 'item_name', 'item_price', 'quantity', 'total_price']


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ['from_status', 'to_status', 'changed_by', 'note', 'created_at']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'customer', 'seller', 'order_type', 'status', 'total_amount', 'is_paid', 'payment_method', 'created_at']
    list_filter = ['status', 'order_type', 'payment_method', 'is_paid']
    search_fields = ['order_id', 'customer__full_name', 'seller__kitchen_name']
    readonly_fields = ['order_id']
    inlines = [OrderItemInline, OrderStatusHistoryInline]
