from apps.notifications.models import Notification


def send_notification(user, notification_type, title, message, action_url='', metadata=None):
    """Helper to create a notification for a user"""
    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        action_url=action_url,
        metadata=metadata or {},
    )
