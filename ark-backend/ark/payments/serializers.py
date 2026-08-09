from rest_framework import serializers
from .models import PaymentSchedule


class PaymentScheduleSerializer(serializers.ModelSerializer):
    # Denormalised from the lease so a payment is self-describing: the dashboard
    # reads /payment-schedules/ without the lease, and previously had no way to
    # know an amount was CAD rather than AED.
    currency = serializers.CharField(source="lease.currency", read_only=True)

    class Meta:
        model = PaymentSchedule
        fields = (
            "id", "cheque_number", "due_date", "amount", "status", "currency",
            "reminder_30d_sent", "reminder_7d_sent", "reminder_1d_sent",
            "created_at",
        )
        read_only_fields = fields


class PaymentStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["ready"])
