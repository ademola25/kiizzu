from rest_framework import serializers
from .models import ReminderLog


class ReminderLogSerializer(serializers.ModelSerializer):
    """A delivery record, and — for `in_app` rows — the notification itself."""

    is_read = serializers.SerializerMethodField()

    class Meta:
        model = ReminderLog
        fields = (
            "id",
            "channel",
            "reminder_type",
            "status",
            "error_message",
            "sent_at",
            "delivered_at",
            "title",
            "body",
            "read_at",
            "is_read",
        )
        read_only_fields = fields

    def get_is_read(self, obj) -> bool:
        return obj.read_at is not None
