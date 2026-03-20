from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.accounts.permissions import IsSeller, IsAdmin

from .models import Category, MenuItem, SubscriptionPlan, SubscriptionPlanItem
from .serializers import (
    CategorySerializer,
    MenuItemListSerializer, MenuItemDetailSerializer, SellerMenuItemSerializer,
    SubscriptionPlanListSerializer, SubscriptionPlanDetailSerializer,
    SellerSubscriptionPlanSerializer, SubscriptionPlanItemSerializer,
)


# ========================
# Categories (Public + Admin)
# ========================

class CategoryListView(generics.ListAPIView):
    """Public: list active categories"""
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    queryset = Category.objects.filter(is_active=True)
    pagination_class = None


class AdminCategoryListCreateView(generics.ListCreateAPIView):
    """Admin: list all + create categories"""
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = CategorySerializer
    queryset = Category.objects.all()
    pagination_class = None


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: update/delete category"""
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = CategorySerializer
    queryset = Category.objects.all()


# ========================
# Menu Items (Public)
# ========================

class PublicMenuItemListView(generics.ListAPIView):
    """Public: list menu items with filters"""
    permission_classes = [AllowAny]
    serializer_class = MenuItemListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['seller', 'category', 'meal_type', 'food_type', 'is_available']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = MenuItem.objects.filter(
            is_active=True,
            seller__approval_status='approved'
        ).select_related('category', 'seller')

        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)

        seller_slug = self.request.query_params.get('seller_slug')
        if seller_slug:
            qs = qs.filter(seller__slug=seller_slug)

        category_slug = self.request.query_params.get('category_slug')
        if category_slug:
            qs = qs.filter(category__slug=category_slug)

        return qs


class PublicMenuItemDetailView(generics.RetrieveAPIView):
    """Public: get menu item detail"""
    permission_classes = [AllowAny]
    serializer_class = MenuItemDetailSerializer
    queryset = MenuItem.objects.filter(is_active=True).select_related('category', 'seller')


# ========================
# Menu Items (Seller)
# ========================

class SellerMenuItemListCreateView(generics.ListCreateAPIView):
    """Seller: list own items + create new"""
    permission_classes = [IsAuthenticated, IsSeller]
    serializer_class = SellerMenuItemSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['category', 'meal_type', 'food_type', 'is_available', 'is_active']
    search_fields = ['name']

    def get_queryset(self):
        profile = getattr(self.request.user, 'seller_profile', None)
        if not profile:
            return MenuItem.objects.none()
        return MenuItem.objects.filter(seller=profile).select_related('category')

    def create(self, request, *args, **kwargs):
        if not hasattr(request.user, 'seller_profile'):
            return Response(
                {'detail': 'Seller profile not found. Please complete seller registration first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)


class SellerMenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Seller: update/delete own item"""
    permission_classes = [IsAuthenticated, IsSeller]
    serializer_class = SellerMenuItemSerializer

    def get_queryset(self):
        profile = getattr(self.request.user, 'seller_profile', None)
        if not profile:
            return MenuItem.objects.none()
        return MenuItem.objects.filter(seller=profile)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsSeller])
def toggle_item_availability(request, pk):
    """Seller: quick toggle availability"""
    profile = getattr(request.user, 'seller_profile', None)
    if not profile:
        return Response({'detail': 'Seller profile not found.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        item = MenuItem.objects.get(pk=pk, seller=profile)
    except MenuItem.DoesNotExist:
        return Response({'detail': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)

    item.is_available = not item.is_available
    item.save(update_fields=['is_available'])
    return Response({'id': item.id, 'is_available': item.is_available})


# ========================
# Subscription Plans (Public)
# ========================

class PublicSubscriptionPlanListView(generics.ListAPIView):
    """Public: list active plans"""
    permission_classes = [AllowAny]
    serializer_class = SubscriptionPlanListSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['seller', 'plan_type']

    def get_queryset(self):
        qs = SubscriptionPlan.objects.filter(
            is_active=True,
            seller__approval_status='approved'
        ).select_related('seller')

        seller_slug = self.request.query_params.get('seller_slug')
        if seller_slug:
            qs = qs.filter(seller__slug=seller_slug)

        return qs


class PublicSubscriptionPlanDetailView(generics.RetrieveAPIView):
    """Public: plan detail with items"""
    permission_classes = [AllowAny]
    serializer_class = SubscriptionPlanDetailSerializer
    queryset = SubscriptionPlan.objects.filter(is_active=True).select_related('seller')


# ========================
# Subscription Plans (Seller)
# ========================

class SellerSubscriptionPlanListCreateView(generics.ListCreateAPIView):
    """Seller: list own plans + create"""
    permission_classes = [IsAuthenticated, IsSeller]
    serializer_class = SellerSubscriptionPlanSerializer

    def get_queryset(self):
        profile = getattr(self.request.user, 'seller_profile', None)
        if not profile:
            return SubscriptionPlan.objects.none()
        return SubscriptionPlan.objects.filter(seller=profile).prefetch_related('plan_items__menu_item')

    def create(self, request, *args, **kwargs):
        if not hasattr(request.user, 'seller_profile'):
            return Response(
                {'detail': 'Seller profile not found. Please complete seller registration first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)


class SellerSubscriptionPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Seller: update/delete own plan"""
    permission_classes = [IsAuthenticated, IsSeller]
    serializer_class = SellerSubscriptionPlanSerializer

    def get_queryset(self):
        profile = getattr(self.request.user, 'seller_profile', None)
        if not profile:
            return SubscriptionPlan.objects.none()
        return SubscriptionPlan.objects.filter(seller=profile)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSeller])
def manage_plan_items(request, pk):
    """Seller: set items for a plan. Body: { items: [{menu_item, meal_type, is_default}] }"""
    profile = getattr(request.user, 'seller_profile', None)
    if not profile:
        return Response({'detail': 'Seller profile not found.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        plan = SubscriptionPlan.objects.get(pk=pk, seller=profile)
    except SubscriptionPlan.DoesNotExist:
        return Response({'detail': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)

    items_data = request.data.get('items', [])

    plan.plan_items.all().delete()
    created = []
    for item_data in items_data:
        menu_item_id = item_data.get('menu_item')
        if not MenuItem.objects.filter(id=menu_item_id, seller=request.user.seller_profile).exists():
            continue
        obj = SubscriptionPlanItem.objects.create(
            plan=plan,
            menu_item_id=menu_item_id,
            meal_type=item_data.get('meal_type', 'lunch'),
            is_default=item_data.get('is_default', True),
        )
        created.append(obj)

    serializer = SubscriptionPlanItemSerializer(created, many=True)
    return Response(serializer.data)
