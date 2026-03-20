import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

from apps.core.models import TimeStampedModel


class Subscription(TimeStampedModel):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    )

    subscription_id = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions'
    )
    seller = models.ForeignKey(
        'sellers.SellerProfile', on_delete=models.CASCADE, related_name='subscriptions'
    )
    plan = models.ForeignKey(
        'menu.SubscriptionPlan', on_delete=models.SET_NULL, null=True
    )
    plan_snapshot = models.JSONField(default=dict)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.PositiveIntegerField()
    remaining_days = models.PositiveIntegerField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    skips_used = models.PositiveIntegerField(default=0)
    max_skips = models.PositiveIntegerField(default=5)
    pauses_used = models.PositiveIntegerField(default=0)
    max_pauses = models.PositiveIntegerField(default=2)
    is_auto_renew = models.BooleanField(default=False)
    pause_start_date = models.DateField(null=True, blank=True)
    pause_end_date = models.DateField(null=True, blank=True)
    delivery_address = models.ForeignKey(
        'accounts.Address', on_delete=models.SET_NULL, null=True
    )

    class Meta:
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['status', 'end_date']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Sub {self.subscription_id} - {self.customer.full_name}"

    def save(self, *args, **kwargs):
        if not self.subscription_id:
            date_str = timezone.now().strftime('%Y%m%d')
            short_uuid = uuid.uuid4().hex[:4].upper()
            self.subscription_id = f"SUB-{date_str}-{short_uuid}"
        super().save(*args, **kwargs)


class SubscriptionSkip(TimeStampedModel):
    subscription = models.ForeignKey(
        Subscription, on_delete=models.CASCADE, related_name='skips'
    )
    skip_date = models.DateField()
    reason = models.TextField(blank=True)
    refund_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    is_refunded = models.BooleanField(default=False)

    class Meta:
        unique_together = ['subscription', 'skip_date']

    def __str__(self):
        return f"Skip {self.skip_date} - {self.subscription.subscription_id}"


class SubscriptionOrder(TimeStampedModel):
    STATUS_CHOICES = (
        ('generated', 'Generated'),
        ('confirmed', 'Confirmed'),
        ('skipped', 'Skipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )

    subscription = models.ForeignKey(
        Subscription, on_delete=models.CASCADE, related_name='daily_orders'
    )
    date = models.DateField()
    meal_type = models.CharField(max_length=10)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='generated')

    class Meta:
        unique_together = ['subscription', 'date', 'meal_type']

    def __str__(self):
        return f"{self.subscription.subscription_id} - {self.date} ({self.meal_type})"
