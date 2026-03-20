from django.db import models
from django.conf import settings

from apps.core.models import TimeStampedModel


class Notification(TimeStampedModel):
    NOTIFICATION_TYPES = (
        ('new_order', 'New Order'),
        ('order_accepted', 'Order Accepted'),
        ('order_rejected', 'Order Rejected'),
        ('order_cancelled', 'Order Cancelled'),
        ('order_status', 'Order Status Update'),
        ('new_subscription', 'New Subscription'),
        ('subscription_order', 'Daily Subscription Order'),
        ('subscription_paused', 'Subscription Paused'),
        ('subscription_resumed', 'Subscription Resumed'),
        ('subscription_cancelled', 'Subscription Cancelled'),
        ('subscription_expired', 'Subscription Expired'),
        ('subscription_refund', 'Subscription Refund'),
        ('subscription_expiring', 'Subscription Expiring'),
        ('payment', 'Payment'),
        ('seller_approval', 'Seller Approval'),
        ('general', 'General'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications'
    )
    notification_type = models.CharField(max_length=25, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=500, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} -> {self.user.full_name}"
