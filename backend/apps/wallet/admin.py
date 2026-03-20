from django.contrib import admin
from .models import Wallet, WalletTransaction


class WalletTransactionInline(admin.TabularInline):
    model = WalletTransaction
    extra = 0
    readonly_fields = ['transaction_type', 'amount', 'balance_after', 'reason', 'reference_id', 'description', 'created_at']
    can_delete = False


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'is_active', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['user__email', 'user__full_name']
    readonly_fields = ['user', 'balance', 'created_at', 'updated_at']
    inlines = [WalletTransactionInline]


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ['wallet', 'transaction_type', 'amount', 'balance_after', 'reason', 'created_at']
    list_filter = ['transaction_type', 'reason']
    search_fields = ['wallet__user__email', 'reference_id', 'description']
    readonly_fields = ['wallet', 'transaction_type', 'amount', 'balance_after', 'reason', 'reference_id', 'description', 'created_at']
