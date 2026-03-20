import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

from apps.core.models import TimeStampedModel


class Order(TimeStampedModel):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('preparing', 'Preparing'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
    )
    ORDER_TYPE_CHOICES = (
        ('instant', 'Instant Order'),
        ('subscription', 'Subscription Order'),
    )
    PAYMENT_METHOD_CHOICES = (
        ('online', 'Online'),
        ('wallet', 'Wallet'),
        ('cod', 'Cash on Delivery'),
    )

    VALID_TRANSITIONS = {
        'pending': ['accepted', 'rejected', 'cancelled'],
        'accepted': ['preparing', 'cancelled'],
        'preparing': ['out_for_delivery'],
        'out_for_delivery': ['delivered'],
    }

    order_id = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders'
    )
    seller = models.ForeignKey(
        'sellers.SellerProfile', on_delete=models.CASCADE, related_name='orders'
    )
    order_type = models.CharField(max_length=15, choices=ORDER_TYPE_CHOICES, default='instant')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    delivery_address = models.ForeignKey(
        'accounts.Address', on_delete=models.SET_NULL, null=True
    )
    delivery_address_snapshot = models.JSONField(default=dict)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    special_instructions = models.TextField(blank=True)
    scheduled_delivery_time = models.DateTimeField(null=True, blank=True)
    actual_delivery_time = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)
    is_paid = models.BooleanField(default=False)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='online')
    subscription_order = models.OneToOneField(
        'subscriptions.SubscriptionOrder', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='linked_order'
    )

    class Meta:
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Order {self.order_id}"

    def save(self, *args, **kwargs):
        if not self.order_id:
            date_str = timezone.now().strftime('%Y%m%d')
            short_uuid = uuid.uuid4().hex[:4].upper()
            self.order_id = f"MOT-{date_str}-{short_uuid}"
        super().save(*args, **kwargs)

    def can_transition_to(self, new_status):
        return new_status in self.VALID_TRANSITIONS.get(self.status, [])

    def transition_to(self, new_status, changed_by=None, note=''):
        if not self.can_transition_to(new_status):
            raise ValueError(
                f"Cannot transition from '{self.status}' to '{new_status}'"
            )
        old_status = self.status
        self.status = new_status
        if new_status == 'delivered':
            self.actual_delivery_time = timezone.now()
        self.save()

        OrderStatusHistory.objects.create(
            order=self,
            from_status=old_status,
            to_status=new_status,
            changed_by=changed_by,
            note=note,
        )


class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey('menu.MenuItem', on_delete=models.SET_NULL, null=True)
    item_name = models.CharField(max_length=200)
    item_price = models.DecimalField(max_digits=8, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.item_name} x{self.quantity}"


class OrderStatusHistory(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    note = models.TextField(blank=True)

    def __str__(self):
        return f"{self.order.order_id}: {self.from_status} -> {self.to_status}"


class Review(TimeStampedModel):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='review')
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews'
    )
    seller = models.ForeignKey(
        'sellers.SellerProfile', on_delete=models.CASCADE, related_name='reviews'
    )
    rating = models.PositiveSmallIntegerField()  # 1-5
    comment = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['seller', '-created_at']),
        ]

    def __str__(self):
        return f"Review by {self.customer.full_name} - {self.rating}/5"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update seller average rating
        from django.db.models import Avg
        avg = Review.objects.filter(seller=self.seller).aggregate(Avg('rating'))['rating__avg']
        self.seller.average_rating = round(avg, 2)
        self.seller.total_ratings = Review.objects.filter(seller=self.seller).count()
        self.seller.save(update_fields=['average_rating', 'total_ratings'])
