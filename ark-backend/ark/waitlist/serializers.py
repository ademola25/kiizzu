from django.db import models, transaction
from rest_framework import serializers

from .models import WaitlistSignup


class WaitlistSignupSerializer(serializers.ModelSerializer):
    referral = serializers.CharField(write_only=True, required=False, allow_blank=True)
    position = serializers.SerializerMethodField()
    referrals = serializers.IntegerField(source="referral_count", read_only=True)
    founding_member = serializers.BooleanField(source="is_founding_member", read_only=True)

    class Meta:
        model = WaitlistSignup
        fields = (
            "id",
            "name",
            "email",
            "phone",
            "audience",
            "referral",
            "referral_code",
            "position",
            "referrals",
            "founding_member",
            "created_at",
        )
        read_only_fields = ("id", "referral_code", "created_at")
        extra_kwargs = {
            "email": {"validators": []},
        }

    def validate_email(self, value):
        return value.strip().lower()

    def validate_referral(self, value):
        return value.strip().upper()

    def get_position(self, obj):
        return obj.waitlist_position()

    @transaction.atomic
    def create(self, validated_data):
        referral_code = validated_data.pop("referral", "")
        signup, created = WaitlistSignup.objects.get_or_create(
            email=validated_data["email"],
            defaults=validated_data,
        )

        if not created:
            changed = False
            for field in ("name", "phone", "audience"):
                next_value = validated_data.get(field)
                if next_value and getattr(signup, field) != next_value:
                    setattr(signup, field, next_value)
                    changed = True
            if changed:
                signup.save(update_fields=["name", "phone", "audience", "updated_at"])
            return signup

        if referral_code:
            referrer = WaitlistSignup.objects.filter(referral_code=referral_code).exclude(pk=signup.pk).first()
            if referrer:
                signup.referred_by = referrer
                signup.save(update_fields=["referred_by", "updated_at"])
                WaitlistSignup.objects.filter(pk=referrer.pk).update(referral_count=models.F("referral_count") + 1)

        return signup
