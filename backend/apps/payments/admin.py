from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_id', 'user', 'amount', 'status', 'payment_for', 'razorpay_order_id', 'created_at']
    list_filter = ['status', 'payment_for']
    search_fields = ['payment_id', 'razorpay_order_id', 'user__full_name']
    readonly_fields = ['payment_id']
