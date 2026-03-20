from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin
from .models import ContactMessage
from .serializers import ContactMessageSerializer


class SubmitContactView(generics.CreateAPIView):
    """Public: submit a contact message."""
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]


class AdminContactListView(generics.ListAPIView):
    """Admin: list all contact messages."""
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = ContactMessage.objects.all()


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def mark_contact_read(request, pk):
    """Admin: toggle read status of a contact message."""
    try:
        msg = ContactMessage.objects.get(pk=pk)
    except ContactMessage.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    msg.is_read = not msg.is_read
    msg.save()
    return Response(ContactMessageSerializer(msg).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def delete_contact(request, pk):
    """Admin: delete a contact message."""
    try:
        msg = ContactMessage.objects.get(pk=pk)
    except ContactMessage.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    msg.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
