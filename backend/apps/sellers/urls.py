from django.urls import path

from apps.sellers.views import (
    SellerPublicListView,
    SellerPublicDetailView,
    SellerRegistrationView,
    SellerProfileView,
    SellerToggleOnlineView,
    SellerDashboardView,
    SellerEarningsView,
    SellerOperatingDaysView,
    AdminSellerListView,
    AdminSellerApproveView,
    AdminSellerRejectView,
    AdminSellerSuspendView,
    AdminSellerDeleteView,
    AdminDashboardView,
    AdminReportsView,
)

urlpatterns = [
    # Public list (no slug)
    path('', SellerPublicListView.as_view(), name='seller-list'),

    # Seller own routes (before slug catch-all)
    path('register/', SellerRegistrationView.as_view(), name='seller-register'),
    path('me/', SellerProfileView.as_view(), name='seller-profile'),
    path('me/toggle-online/', SellerToggleOnlineView.as_view(), name='seller-toggle-online'),
    path('me/dashboard/', SellerDashboardView.as_view(), name='seller-dashboard'),
    path('me/earnings/', SellerEarningsView.as_view(), name='seller-earnings'),
    path('me/operating-days/', SellerOperatingDaysView.as_view(), name='seller-operating-days'),

    # Admin routes (before slug catch-all)
    path('admin/list/', AdminSellerListView.as_view(), name='admin-seller-list'),
    path('admin/<int:pk>/approve/', AdminSellerApproveView.as_view(), name='admin-seller-approve'),
    path('admin/<int:pk>/reject/', AdminSellerRejectView.as_view(), name='admin-seller-reject'),
    path('admin/<int:pk>/suspend/', AdminSellerSuspendView.as_view(), name='admin-seller-suspend'),
    path('admin/<int:pk>/delete/', AdminSellerDeleteView.as_view(), name='admin-seller-delete'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/reports/', AdminReportsView.as_view(), name='admin-reports'),

    # Public detail by slug (LAST - catch-all pattern)
    path('<slug:slug>/', SellerPublicDetailView.as_view(), name='seller-detail'),
]
