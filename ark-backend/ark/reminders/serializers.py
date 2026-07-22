from rest_framework import serializers
from .models import ReminderLog


class ReminderLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReminderLog
        fields = ("id", "channel", "reminder_type", "status", "error_message", "sent_at", "delivered_at")
        read_only_fields = fields
