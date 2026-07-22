from django.urls import path
from . import views

urlpatterns = [
    path("", views.ReminderLogListView.as_view(), name="reminder-list"),
]
