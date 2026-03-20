from django.db import models
from django.conf import settings

from apps.core.models import TimeStampedModel


class Wallet(TimeStampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet'
    )
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Wallet of {self.user.full_name} - Rs.{self.balance}"


class WalletTransaction(TimeStampedModel):
    TRANSACTION_TYPES = (
        ('credit', 'Credit'),
        ('debit', 'Debit'),
    )
    REASON_CHOICES = (
        ('recharge', 'Wallet Recharge'),
        ('order_payment', 'Order Payment'),
        ('refund', 'Refund'),
        ('subscription_refund', 'Subscription Refund'),
        ('cashback', 'Cashback'),
        ('admin_credit', 'Admin Credit'),
    )

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    balance_after = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=25, choices=REASON_CHOICES)
    reference_id = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.transaction_type} Rs.{self.amount} ({self.reason})"
