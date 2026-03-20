from django.db import models
from django.conf import settings

from apps.core.models import TimeStampedModel


class SellerProfile(TimeStampedModel):
    APPROVAL_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='seller_profile'
    )
    kitchen_name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='sellers/logos/', null=True, blank=True)
    banner_image = models.ImageField(upload_to='sellers/banners/', null=True, blank=True)
    address_line = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    fssai_license = models.CharField(max_length=20, blank=True)
    fssai_document = models.FileField(upload_to='sellers/documents/', null=True, blank=True)
    pan_number = models.CharField(max_length=10, blank=True)
    gst_number = models.CharField(max_length=15, blank=True)
    bank_account_number = models.CharField(max_length=20, blank=True)
    bank_ifsc = models.CharField(max_length=11, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    approval_status = models.CharField(max_length=10, choices=APPROVAL_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    is_online = models.BooleanField(default=False)
    is_accepting_orders = models.BooleanField(default=True)
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)
    delivery_radius_km = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    minimum_order_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_ratings = models.PositiveIntegerField(default=0)
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)

    def __str__(self):
        return self.kitchen_name

    @property
    def is_approved(self):
        return self.approval_status == 'approved'


class SellerOperatingDay(models.Model):
    seller = models.ForeignKey(SellerProfile, on_delete=models.CASCADE, related_name='operating_days')
    day_of_week = models.IntegerField()  # 0=Monday, 6=Sunday
    is_open = models.BooleanField(default=True)

    class Meta:
        unique_together = ['seller', 'day_of_week']

    def __str__(self):
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return f"{self.seller.kitchen_name} - {days[self.day_of_week]}"
