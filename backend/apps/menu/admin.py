from django.contrib import admin
from .models import Category, MenuItem, SubscriptionPlan, SubscriptionPlanItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'display_order', 'is_active']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['display_order', 'is_active']


class SubscriptionPlanItemInline(admin.TabularInline):
    model = SubscriptionPlanItem
    extra = 0


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'seller', 'category', 'price', 'meal_type', 'food_type', 'is_available', 'is_active']
    list_filter = ['meal_type', 'food_type', 'is_available', 'is_active', 'category']
    search_fields = ['name', 'seller__kitchen_name']
    list_editable = ['is_available', 'is_active']


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'seller', 'plan_type', 'duration_days', 'price', 'daily_price', 'is_active']
    list_filter = ['plan_type', 'is_active']
    search_fields = ['name', 'seller__kitchen_name']
    inlines = [SubscriptionPlanItemInline]
