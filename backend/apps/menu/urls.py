from django.urls import path

from . import views

urlpatterns = [
    # Public - Categories
    path('categories/', views.CategoryListView.as_view(), name='category-list'),

    # Public - Menu Items
    path('items/', views.PublicMenuItemListView.as_view(), name='menu-item-list'),
    path('items/<int:pk>/', views.PublicMenuItemDetailView.as_view(), name='menu-item-detail'),

    # Public - Subscription Plans
    path('plans/', views.PublicSubscriptionPlanListView.as_view(), name='plan-list'),
    path('plans/<int:pk>/', views.PublicSubscriptionPlanDetailView.as_view(), name='plan-detail'),

    # Seller - Menu Items
    path('seller/items/', views.SellerMenuItemListCreateView.as_view(), name='seller-menu-items'),
    path('seller/items/<int:pk>/', views.SellerMenuItemDetailView.as_view(), name='seller-menu-item-detail'),
    path('seller/items/<int:pk>/toggle/', views.toggle_item_availability, name='seller-menu-item-toggle'),

    # Seller - Subscription Plans
    path('seller/plans/', views.SellerSubscriptionPlanListCreateView.as_view(), name='seller-plans'),
    path('seller/plans/<int:pk>/', views.SellerSubscriptionPlanDetailView.as_view(), name='seller-plan-detail'),
    path('seller/plans/<int:pk>/items/', views.manage_plan_items, name='seller-plan-items'),

    # Admin - Categories
    path('admin/categories/', views.AdminCategoryListCreateView.as_view(), name='admin-category-list'),
    path('admin/categories/<int:pk>/', views.AdminCategoryDetailView.as_view(), name='admin-category-detail'),
]
