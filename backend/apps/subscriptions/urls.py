from django.urls import path
from . import views

urlpatterns = [
    # Customer
    path('', views.CustomerSubscriptionListView.as_view(), name='subscription-list'),
    path('subscribe/', views.subscribe, name='subscribe'),
    path('<int:pk>/', views.CustomerSubscriptionDetailView.as_view(), name='subscription-detail'),
    path('<int:pk>/skip/', views.skip_date, name='subscription-skip'),
    path('<int:pk>/pause/', views.pause_subscription, name='subscription-pause'),
    path('<int:pk>/resume/', views.resume_subscription, name='subscription-resume'),
    path('<int:pk>/cancel/', views.cancel_subscription, name='subscription-cancel'),
    path('<int:pk>/calendar/', views.subscription_calendar, name='subscription-calendar'),

    # Seller
    path('seller/', views.SellerSubscriptionListView.as_view(), name='seller-subscription-list'),
    path('seller/today/', views.seller_todays_orders, name='seller-today-orders'),
    path('seller/<int:pk>/', views.SellerSubscriptionDetailView.as_view(), name='seller-subscription-detail'),

    # Admin
    path('admin/', views.AdminSubscriptionListView.as_view(), name='admin-subscription-list'),
]
