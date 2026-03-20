import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

from apps.core.models import TimeStampedModel


class Payment(TimeStampedModel):
    STATUS_CHOICES = (
        ('initiated', 'Initiated'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    PAYMENT_FOR_CHOICES = (
        ('order', 'Order'),
        ('subscription', 'Subscription'),
        ('wallet_recharge', 'Wallet Recharge'),
    )

    payment_id = models.CharField(max_length=30, unique=True, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments'
    )
    razorpay_order_id = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='initiated')
    payment_for = models.CharField(max_length=20, choices=PAYMENT_FOR_CHOICES)
    order = models.ForeignKey(
        'orders.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments'
    )
    subscription = models.ForeignKey(
        'subscriptions.Subscription', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='payments'
    )
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refund_id = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Payment {self.payment_id} - {self.status}"

    def save(self, *args, **kwargs):
        if not self.payment_id:
            date_str = timezone.now().strftime('%Y%m%d')
            short_uuid = uuid.uuid4().hex[:6].upper()
            self.payment_id = f"PAY-{date_str}-{short_uuid}"
        super().save(*args, **kwargs)
