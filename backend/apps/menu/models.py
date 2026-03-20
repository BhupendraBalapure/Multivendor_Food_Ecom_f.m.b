from django.db import models

from apps.core.models import TimeStampedModel


class Category(TimeStampedModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.ImageField(upload_to='categories/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['display_order']

    def __str__(self):
        return self.name


class MenuItem(TimeStampedModel):
    MEAL_TYPE_CHOICES = (
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
    )
    VEG_CHOICES = (
        ('veg', 'Vegetarian'),
        ('non_veg', 'Non-Vegetarian'),
        ('egg', 'Contains Egg'),
    )

    seller = models.ForeignKey(
        'sellers.SellerProfile', on_delete=models.CASCADE, related_name='menu_items'
    )
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='items')
    name = models.CharField(max_length=200)
    slug = models.SlugField()
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='menu/items/', null=True, blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    discounted_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    meal_type = models.CharField(max_length=10, choices=MEAL_TYPE_CHOICES)
    food_type = models.CharField(max_length=10, choices=VEG_CHOICES, default='veg')
    is_available = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    preparation_time_mins = models.PositiveIntegerField(default=30)
    calories = models.PositiveIntegerField(null=True, blank=True)
    serves = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ['seller', 'slug']

    def __str__(self):
        return f"{self.name} ({self.seller.kitchen_name})"

    @property
    def effective_price(self):
        return self.discounted_price if self.discounted_price else self.price


class SubscriptionPlan(TimeStampedModel):
    PLAN_TYPE_CHOICES = (
        ('breakfast', 'Breakfast Only'),
        ('lunch', 'Lunch Only'),
        ('dinner', 'Dinner Only'),
        ('lunch_dinner', 'Lunch + Dinner'),
        ('all_meals', 'All Meals'),
    )

    seller = models.ForeignKey(
        'sellers.SellerProfile', on_delete=models.CASCADE, related_name='subscription_plans'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    plan_type = models.CharField(max_length=15, choices=PLAN_TYPE_CHOICES)
    duration_days = models.PositiveIntegerField(default=30)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    daily_price = models.DecimalField(max_digits=8, decimal_places=2)
    items_per_meal = models.PositiveIntegerField(default=1)
    includes_weekends = models.BooleanField(default=True)
    max_skips_allowed = models.PositiveIntegerField(default=5)
    max_pauses_allowed = models.PositiveIntegerField(default=2)
    is_active = models.BooleanField(default=True)
    image = models.ImageField(upload_to='plans/', null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.seller.kitchen_name}"


class SubscriptionPlanItem(models.Model):
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE, related_name='plan_items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    meal_type = models.CharField(max_length=10)
    is_default = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.plan.name} - {self.menu_item.name}"
