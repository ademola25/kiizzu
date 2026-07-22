from rest_framework import serializers
from .models import PaymentSchedule


class PaymentScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentSchedule
        fields = (
            "id", "cheque_number", "due_date", "amount", "status",
            "reminder_30d_sent", "reminder_7d_sent", "reminder_1d_sent",
            "created_at",
        )
        read_only_fields = fields


class PaymentStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["ready"])
