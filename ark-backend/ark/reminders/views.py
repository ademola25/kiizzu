from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ReminderLog
from .serializers import ReminderLogSerializer
from .services.inapp import sync_in_app_notifications


class ReminderLogListView(generics.ListAPIView):
    """GET /api/v1/reminders/ — full delivery history, every channel."""
    serializer_class = ReminderLogSerializer

    def get_queryset(self):
        return ReminderLog.objects.filter(user=self.request.user)


class NotificationFeedView(generics.ListAPIView):
    """GET /api/v1/reminders/notifications/ — the in-app feed.

    Deliberately narrower than the history above: this is what the bell opens,
    so it must only contain things actually addressed to the user *inside* the
    app. Showing a failed SMS row here would read as a notification the user
    never received on a channel they may not even have enabled.
    """
    serializer_class = ReminderLogSerializer

    def get_queryset(self):
        # Materialise before reading: nothing else writes in-app rows in
        # production (no worker is deployed), so this IS the generator.
        sync_in_app_notifications(self.request.user)
        return ReminderLog.objects.filter(
            user=self.request.user,
            channel=ReminderLog.Channel.IN_APP,
        )


class UnreadCountView(APIView):
    """GET /api/v1/reminders/notifications/unread-count/ — badge number."""

    def get(self, request):
        # The badge is usually the first thing to ask, so it has to generate
        # too — otherwise the bell reads 0 until the feed is opened.
        sync_in_app_notifications(request.user)
        count = ReminderLog.objects.filter(
            user=request.user,
            channel=ReminderLog.Channel.IN_APP,
            read_at__isnull=True,
        ).count()
        return Response({"unread": count})


class MarkReadView(APIView):
    """POST /api/v1/reminders/notifications/<pk>/read/ — mark one as read."""

    def post(self, request, pk):
        # filter().update() rather than get-then-save: this is called as the
        # user scrolls the list, so concurrent calls for the same row are
        # normal and must not 500. Scoped to the requesting user so one tenant
        # can never mark another's notification read.
        updated = ReminderLog.objects.filter(
            pk=pk,
            user=request.user,
            channel=ReminderLog.Channel.IN_APP,
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        if not updated and not ReminderLog.objects.filter(pk=pk, user=request.user).exists():
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MarkAllReadView(APIView):
    """POST /api/v1/reminders/notifications/read-all/ — clear the badge."""

    def post(self, request):
        updated = ReminderLog.objects.filter(
            user=request.user,
            channel=ReminderLog.Channel.IN_APP,
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        return Response({"marked_read": updated})
