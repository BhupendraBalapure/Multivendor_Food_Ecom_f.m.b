from rest_framework import serializers
from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            'id', 'notification_type', 'title', 'message',
            'is_read', 'action_url', 'metadata', 'created_at',
        )
        read_only_fields = ('id', 'notification_type', 'title', 'message', 'action_url', 'metadata', 'created_at')
