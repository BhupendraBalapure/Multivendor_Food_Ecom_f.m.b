from django.urls import path
from . import views

urlpatterns = [
    path('balance/', views.get_balance, name='wallet-balance'),
    path('recharge/', views.recharge_wallet, name='wallet-recharge'),
    path('add-money/', views.add_money, name='wallet-add-money'),
    path('transactions/', views.TransactionListView.as_view(), name='wallet-transactions'),
]
