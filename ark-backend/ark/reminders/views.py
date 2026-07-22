from rest_framework import generics
from .models import ReminderLog
from .serializers import ReminderLogSerializer


class ReminderLogListView(generics.ListAPIView):
    """GET /api/v1/reminders/ — User's notification history."""
    serializer_class = ReminderLogSerializer

    def get_queryset(self):
        return ReminderLog.objects.filter(user=self.request.user)
