from rest_framework import status, generics, filters
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta

from apps.sellers.models import SellerProfile, SellerOperatingDay
from apps.sellers.serializers import (
    SellerRegistrationSerializer,
    SellerProfileSerializer,
    SellerPublicListSerializer,
    SellerPublicDetailSerializer,
    SellerOperatingDaySerializer,
    AdminSellerActionSerializer,
)
from apps.accounts.permissions import IsSeller, IsAdmin, IsCustomer
from apps.notifications.utils import send_notification


# ==================== PUBLIC ====================

class SellerPublicListView(generics.ListAPIView):
    """Public: list all approved sellers"""
    serializer_class = SellerPublicListSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['city', 'state', 'is_online']
    search_fields = ['kitchen_name', 'description', 'city']
    ordering_fields = ['average_rating', 'kitchen_name', 'created_at']
    ordering = ['-average_rating']

    def get_queryset(self):
        return SellerProfile.objects.filter(
            approval_status='approved'
        ).select_related('user')


class SellerPublicDetailView(generics.RetrieveAPIView):
    """Public: get seller detail by slug"""
    serializer_class = SellerPublicDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return SellerProfile.objects.filter(
            approval_status='approved'
        ).select_related('user').prefetch_related('operating_days')


# ==================== SELLER ====================

class SellerRegistrationView(generics.CreateAPIView):
    """Register current user as a seller"""
    serializer_class = SellerRegistrationSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Check if user already has a seller profile
        if hasattr(request.user, 'seller_profile'):
            return Response(
                {'detail': 'You already have a seller profile.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        # Notify admins about new seller registration
        from apps.accounts.models import User
        admins = User.objects.filter(role='admin', is_active=True)
        for admin in admins:
            send_notification(
                user=admin,
                notification_type='seller_approval',
                title='New Seller Registration',
                message=f'{profile.kitchen_name} has registered and is waiting for approval.',
                action_url=f'/admin/sellers',
            )

        return Response(
            SellerProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED
        )


class SellerProfileView(generics.RetrieveUpdateAPIView):
    """Seller: view/update own profile"""
    serializer_class = SellerProfileSerializer
    permission_classes = [IsSeller]

    def get_object(self):
        return self.request.user.seller_profile


class SellerToggleOnlineView(APIView):
    """Seller: toggle online/offline status"""
    permission_classes = [IsSeller]

    def patch(self, request):
        profile = request.user.seller_profile
        if not profile.is_approved:
            return Response(
                {'detail': 'Your profile is not yet approved.'},
                status=status.HTTP_403_FORBIDDEN
            )
        profile.is_online = not profile.is_online
        profile.save()
        return Response({
            'is_online': profile.is_online,
            'detail': f'You are now {"online" if profile.is_online else "offline"}.'
        })


class SellerDashboardView(APIView):
    """Seller: get dashboard stats with recent orders"""
    permission_classes = [IsSeller]

    def get(self, request):
        profile = request.user.seller_profile
        today = timezone.now().date()

        from apps.orders.models import Order
        from apps.subscriptions.models import Subscription

        today_orders = Order.objects.filter(seller=profile, created_at__date=today)
        active_subs = Subscription.objects.filter(seller=profile, status='active')

        today_earnings = today_orders.filter(
            status='delivered', is_paid=True
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        total_earnings = Order.objects.filter(
            seller=profile, status='delivered', is_paid=True
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # Recent orders (last 5)
        recent_orders = list(
            Order.objects.filter(seller=profile)
            .select_related('customer')
            .order_by('-created_at')[:5]
            .values('id', 'order_id', 'status', 'total_amount', 'created_at',
                    'customer__full_name', 'order_type')
        )

        return Response({
            'today_orders_count': today_orders.count(),
            'today_pending': today_orders.filter(status='pending').count(),
            'active_subscribers': active_subs.count(),
            'today_earnings': float(today_earnings),
            'total_earnings': float(total_earnings),
            'is_online': profile.is_online,
            'approval_status': profile.approval_status,
            'recent_orders': recent_orders,
        })


class SellerEarningsView(APIView):
    """Seller: earnings stats with daily breakdown"""
    permission_classes = [IsSeller]

    def get(self, request):
        from apps.orders.models import Order
        from django.db.models.functions import TruncDate

        profile = request.user.seller_profile
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days - 1)

        delivered_orders = Order.objects.filter(
            seller=profile, status='delivered', is_paid=True
        )

        total_earnings = delivered_orders.aggregate(total=Sum('total_amount'))['total'] or 0
        period_earnings = delivered_orders.filter(
            created_at__date__gte=start_date
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        period_orders = Order.objects.filter(
            seller=profile, created_at__date__gte=start_date
        ).count()

        # Daily breakdown
        daily_earnings = list(
            delivered_orders.filter(created_at__date__gte=start_date)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(earnings=Sum('total_amount'), orders=Count('id'))
            .order_by('date')
        )
        for item in daily_earnings:
            item['date'] = str(item['date'])
            item['earnings'] = float(item['earnings'])

        # Recent paid orders
        recent_paid = list(
            delivered_orders.select_related('customer')
            .order_by('-created_at')[:10]
            .values('id', 'order_id', 'total_amount', 'created_at',
                    'customer__full_name', 'order_type')
        )

        return Response({
            'total_earnings': float(total_earnings),
            'period_earnings': float(period_earnings),
            'period_orders': period_orders,
            'period_days': days,
            'daily_earnings': daily_earnings,
            'recent_paid_orders': recent_paid,
        })


class SellerOperatingDaysView(APIView):
    """Seller: update operating days"""
    permission_classes = [IsSeller]

    def get(self, request):
        profile = request.user.seller_profile
        days = profile.operating_days.all().order_by('day_of_week')
        return Response(SellerOperatingDaySerializer(days, many=True).data)

    def put(self, request):
        profile = request.user.seller_profile
        days_data = request.data  # expects list of {day_of_week, is_open}

        if not isinstance(days_data, list):
            return Response(
                {'detail': 'Expected a list of operating days.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        for day_data in days_data:
            SellerOperatingDay.objects.update_or_create(
                seller=profile,
                day_of_week=day_data['day_of_week'],
                defaults={'is_open': day_data.get('is_open', True)},
            )

        days = profile.operating_days.all().order_by('day_of_week')
        return Response(SellerOperatingDaySerializer(days, many=True).data)


# ==================== ADMIN ====================

class AdminSellerListView(generics.ListAPIView):
    """Admin: list all sellers with filters"""
    serializer_class = SellerProfileSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['approval_status', 'city', 'is_online']
    search_fields = ['kitchen_name', 'user__full_name', 'user__email', 'city']
    ordering_fields = ['created_at', 'kitchen_name', 'approval_status']
    ordering = ['-created_at']

    def get_queryset(self):
        return SellerProfile.objects.select_related('user').prefetch_related('operating_days')


class AdminSellerApproveView(APIView):
    """Admin: approve a seller"""
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            profile = SellerProfile.objects.select_related('user').get(pk=pk)
        except SellerProfile.DoesNotExist:
            return Response({'detail': 'Seller not found.'}, status=status.HTTP_404_NOT_FOUND)

        if profile.approval_status == 'approved':
            return Response({'detail': 'Seller is already approved.'}, status=status.HTTP_400_BAD_REQUEST)

        profile.approval_status = 'approved'
        profile.rejection_reason = ''
        profile.save()

        send_notification(
            user=profile.user,
            notification_type='seller_approval',
            title='Profile Approved!',
            message=f'Your kitchen "{profile.kitchen_name}" has been approved. You can now go online and start receiving orders!',
            action_url='/seller/dashboard',
        )

        return Response({'detail': 'Seller approved successfully.', 'approval_status': 'approved'})


class AdminSellerRejectView(APIView):
    """Admin: reject a seller"""
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            profile = SellerProfile.objects.select_related('user').get(pk=pk)
        except SellerProfile.DoesNotExist:
            return Response({'detail': 'Seller not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminSellerActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get('reason', '')

        profile.approval_status = 'rejected'
        profile.rejection_reason = reason
        profile.save()

        send_notification(
            user=profile.user,
            notification_type='seller_approval',
            title='Profile Rejected',
            message=f'Your kitchen "{profile.kitchen_name}" registration was rejected. Reason: {reason or "Not specified"}',
            action_url='/seller/onboarding',
        )

        return Response({'detail': 'Seller rejected.', 'approval_status': 'rejected'})


class AdminSellerSuspendView(APIView):
    """Admin: suspend a seller"""
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            profile = SellerProfile.objects.select_related('user').get(pk=pk)
        except SellerProfile.DoesNotExist:
            return Response({'detail': 'Seller not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminSellerActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get('reason', '')

        profile.approval_status = 'suspended'
        profile.is_online = False
        profile.rejection_reason = reason
        profile.save()

        send_notification(
            user=profile.user,
            notification_type='seller_approval',
            title='Account Suspended',
            message=f'Your kitchen "{profile.kitchen_name}" has been suspended. Reason: {reason or "Not specified"}',
            action_url='/seller/dashboard',
        )

        return Response({'detail': 'Seller suspended.', 'approval_status': 'suspended'})


class AdminSellerDeleteView(APIView):
    """Admin: delete a seller profile and optionally their user account"""
    permission_classes = [IsAdmin]

    def delete(self, request, pk):
        try:
            profile = SellerProfile.objects.select_related('user').get(pk=pk)
        except SellerProfile.DoesNotExist:
            return Response({'detail': 'Seller not found.'}, status=status.HTTP_404_NOT_FOUND)
        user = profile.user
        profile.delete()
        # Also deactivate the user account
        user.is_active = False
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminDashboardView(APIView):
    """Admin: get platform dashboard stats with recent data"""
    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.accounts.models import User
        from apps.orders.models import Order
        from apps.subscriptions.models import Subscription
        from apps.wallet.models import WalletTransaction

        today = timezone.now().date()

        total_users = User.objects.filter(role='customer', is_active=True).count()
        total_sellers = SellerProfile.objects.count()
        approved_sellers = SellerProfile.objects.filter(approval_status='approved').count()
        pending_sellers = SellerProfile.objects.filter(approval_status='pending').count()

        today_orders = Order.objects.filter(created_at__date=today).count()
        total_orders = Order.objects.count()

        active_subs = Subscription.objects.filter(status='active').count()
        total_subs = Subscription.objects.count()

        total_revenue = Order.objects.filter(
            status='delivered', is_paid=True
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        today_revenue = Order.objects.filter(
            created_at__date=today, status='delivered', is_paid=True
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # Recent orders (last 5)
        recent_orders = list(
            Order.objects.select_related('customer', 'seller')
            .order_by('-created_at')[:5]
            .values('id', 'order_id', 'status', 'total_amount', 'created_at',
                    'customer__full_name', 'seller__kitchen_name')
        )

        # Pending sellers (last 5)
        pending_seller_list = list(
            SellerProfile.objects.filter(approval_status='pending')
            .select_related('user')
            .order_by('-created_at')[:5]
            .values('id', 'kitchen_name', 'city', 'created_at', 'user__full_name', 'user__email')
        )

        # Revenue trend (last 7 days)
        week_ago = today - timedelta(days=6)
        revenue_trend = list(
            Order.objects.filter(
                created_at__date__gte=week_ago, status='delivered', is_paid=True
            ).annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(revenue=Sum('total_amount'), count=Count('id'))
            .order_by('date')
        )
        for item in revenue_trend:
            item['date'] = str(item['date'])
            item['revenue'] = float(item['revenue'])

        return Response({
            'total_users': total_users,
            'total_sellers': total_sellers,
            'approved_sellers': approved_sellers,
            'pending_sellers': pending_sellers,
            'today_orders': today_orders,
            'total_orders': total_orders,
            'active_subscriptions': active_subs,
            'total_subscriptions': total_subs,
            'total_revenue': float(total_revenue),
            'today_revenue': float(today_revenue),
            'recent_orders': recent_orders,
            'pending_seller_list': pending_seller_list,
            'revenue_trend': revenue_trend,
        })


class AdminReportsView(APIView):
    """Admin: detailed reports with date ranges"""
    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.accounts.models import User
        from apps.orders.models import Order
        from apps.subscriptions.models import Subscription

        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days - 1)

        # Revenue by day
        revenue_by_day = list(
            Order.objects.filter(
                created_at__date__gte=start_date, status='delivered', is_paid=True
            ).annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(revenue=Sum('total_amount'), orders=Count('id'))
            .order_by('date')
        )
        for item in revenue_by_day:
            item['date'] = str(item['date'])
            item['revenue'] = float(item['revenue'])

        # Orders by status
        orders_by_status = list(
            Order.objects.filter(created_at__date__gte=start_date)
            .values('status')
            .annotate(count=Count('id'))
        )

        # Orders by payment method
        orders_by_payment = list(
            Order.objects.filter(created_at__date__gte=start_date)
            .values('payment_method')
            .annotate(count=Count('id'))
        )

        # Subscriptions by status
        subs_by_status = list(
            Subscription.objects.values('status')
            .annotate(count=Count('id'))
        )

        # New user registrations by day
        users_by_day = list(
            User.objects.filter(
                date_joined__date__gte=start_date, role='customer'
            ).annotate(date=TruncDate('date_joined'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        for item in users_by_day:
            item['date'] = str(item['date'])

        # Top sellers by revenue
        top_sellers = list(
            Order.objects.filter(
                created_at__date__gte=start_date, status='delivered', is_paid=True
            ).values('seller__kitchen_name', 'seller__id')
            .annotate(revenue=Sum('total_amount'), orders=Count('id'))
            .order_by('-revenue')[:10]
        )
        for item in top_sellers:
            item['revenue'] = float(item['revenue'])

        # Summary totals for period
        period_revenue = Order.objects.filter(
            created_at__date__gte=start_date, status='delivered', is_paid=True
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        period_orders = Order.objects.filter(created_at__date__gte=start_date).count()
        period_new_users = User.objects.filter(date_joined__date__gte=start_date, role='customer').count()
        period_new_subs = Subscription.objects.filter(created_at__date__gte=start_date).count()

        return Response({
            'period_days': days,
            'summary': {
                'revenue': float(period_revenue),
                'orders': period_orders,
                'new_users': period_new_users,
                'new_subscriptions': period_new_subs,
            },
            'revenue_by_day': revenue_by_day,
            'orders_by_status': orders_by_status,
            'orders_by_payment': orders_by_payment,
            'subs_by_status': subs_by_status,
            'users_by_day': users_by_day,
            'top_sellers': top_sellers,
        })
