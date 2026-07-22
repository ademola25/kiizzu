from rest_framework import serializers
from ark.payments.serializers import PaymentScheduleSerializer
from .models import Lease


class LeaseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lease
        fields = ("building_name", "area", "unit_number", "address", "cheque_pattern", "start_date", "rent_amount")

    def validate_cheque_pattern(self, value):
        if value not in (1, 2, 3, 4, 6):
            raise serializers.ValidationError("Must be 1, 2, 3, 4, or 6.")
        return value

    def validate_rent_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Rent amount must be positive.")
        return value


class LeaseDetailSerializer(serializers.ModelSerializer):
    payment_schedules = PaymentScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Lease
        fields = (
            "id", "building_name", "area", "unit_number", "address",
            "cheque_pattern", "start_date", "rent_amount",
            "payment_schedules", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class LeaseUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lease
        fields = ("building_name", "area", "unit_number", "address", "cheque_pattern", "start_date", "rent_amount")

    def validate_cheque_pattern(self, value):
        if value not in (1, 2, 3, 4, 6):
            raise serializers.ValidationError("Must be 1, 2, 3, 4, or 6.")
        return value
