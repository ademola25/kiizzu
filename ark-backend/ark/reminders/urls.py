from django.urls import path
from . import views

urlpatterns = [
    # More specific paths first: "notifications/..." must not be swallowed by
    # the bare list route.
    path("notifications/", views.NotificationFeedView.as_view(), name="notification-feed"),
    path("notifications/unread-count/", views.UnreadCountView.as_view(), name="notification-unread-count"),
    path("notifications/read-all/", views.MarkAllReadView.as_view(), name="notification-read-all"),
    path("notifications/<int:pk>/read/", views.MarkReadView.as_view(), name="notification-read"),
    path("", views.ReminderLogListView.as_view(), name="reminder-list"),
]
