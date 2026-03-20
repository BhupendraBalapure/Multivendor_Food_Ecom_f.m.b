from django.urls import path
from . import views

urlpatterns = [
    path('contact/', views.SubmitContactView.as_view(), name='submit-contact'),
    path('admin/contacts/', views.AdminContactListView.as_view(), name='admin-contacts'),
    path('admin/contacts/<int:pk>/read/', views.mark_contact_read, name='mark-contact-read'),
    path('admin/contacts/<int:pk>/delete/', views.delete_contact, name='delete-contact'),
]
