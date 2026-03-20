from django.urls import path
from . import views

urlpatterns = [
    # Customer
    path('dashboard/', views.customer_dashboard, name='customer-dashboard'),
    path('', views.CustomerOrderListView.as_view(), name='customer-order-list'),
    path('create/', views.create_order, name='create-order'),
    path('<int:pk>/', views.CustomerOrderDetailView.as_view(), name='customer-order-detail'),
    path('<int:pk>/cancel/', views.cancel_order, name='cancel-order'),
    path('<int:pk>/review/', views.submit_review, name='submit-review'),
    path('reviews/seller/<int:seller_id>/', views.seller_reviews, name='seller-reviews'),

    # Seller
    path('seller/', views.SellerOrderListView.as_view(), name='seller-order-list'),
    path('seller/<int:pk>/', views.SellerOrderDetailView.as_view(), name='seller-order-detail'),
    path('seller/<int:pk>/accept/', views.accept_order, name='accept-order'),
    path('seller/<int:pk>/reject/', views.reject_order, name='reject-order'),
    path('seller/<int:pk>/status/', views.update_order_status, name='update-order-status'),
    path('seller/<int:pk>/add-item/', views.seller_add_order_item, name='seller-add-order-item'),
    path('seller/<int:pk>/items/<int:item_id>/', views.seller_update_order_item, name='seller-update-order-item'),
    path('seller/<int:pk>/items/<int:item_id>/delete/', views.seller_delete_order_item, name='seller-delete-order-item'),

    # Admin
    path('admin/', views.AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/<int:pk>/', views.AdminOrderDetailView.as_view(), name='admin-order-detail'),
    path('admin/<int:pk>/status/', views.admin_update_order_status, name='admin-update-order-status'),
    path('admin/<int:pk>/add-item/', views.admin_add_order_item, name='admin-add-order-item'),
    path('admin/<int:pk>/items/<int:item_id>/', views.admin_update_order_item, name='admin-update-order-item'),
    path('admin/<int:pk>/items/<int:item_id>/delete/', views.admin_delete_order_item, name='admin-delete-order-item'),
]
