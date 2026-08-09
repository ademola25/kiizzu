from rest_framework import serializers
from ark.payments.serializers import PaymentScheduleSerializer
from schedule_engine.types import ChequePattern
from .models import Lease


def _validate_pattern(value):
    """Single source of truth for accepted patterns.

    Previously each serializer hardcoded "1, 2, 3, 4, or 6", so adding monthly
    meant remembering three places. Derive it from the engine enum instead —
    that is what actually computes the schedule.
    """
    valid = sorted(p.value for p in ChequePattern)
    if value not in valid:
        raise serializers.ValidationError(
            f"Must be one of {', '.join(str(v) for v in valid)}."
        )
    return value


class LeaseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lease
        fields = (
            "building_name", "area", "city", "country", "currency", "unit_number",
            "address", "cheque_pattern", "start_date", "rent_amount",
        )

    def validate_cheque_pattern(self, value):
        return _validate_pattern(value)

    def validate_rent_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Rent amount must be positive.")
        return value


class LeaseDetailSerializer(serializers.ModelSerializer):
    payment_schedules = PaymentScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Lease
        fields = (
            "id", "building_name", "area", "city", "country", "currency",
            "unit_number", "address",
            "cheque_pattern", "start_date", "rent_amount",
            "payment_schedules", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class LeaseUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lease
        fields = (
            "building_name", "area", "city", "country", "currency", "unit_number",
            "address", "cheque_pattern", "start_date", "rent_amount",
        )

    def validate_cheque_pattern(self, value):
        return _validate_pattern(value)
