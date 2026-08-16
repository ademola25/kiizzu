from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ("id", "email", "name", "phone", "timezone", "password")

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    """The `/auth/me/` representation, including reminder channel preferences.

    All four channels are exposed under matching `notify_*` names so the app can
    treat them uniformly; WhatsApp maps onto its historic column, which also
    carries the consent timestamp.

    `notification_plan` tells the client which channels this account may
    actually turn on. Without it the app would have to re-derive the paid/free
    split itself and the two would eventually disagree — the server stays the
    only authority on what a plan entitles you to.
    """

    notify_whatsapp = serializers.BooleanField(source="whatsapp_opted_in", required=False)
    notification_plan = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "name",
            "phone",
            "timezone",
            "email_verified",
            "onboarding_complete",
            "whatsapp_opted_in",
            "notify_in_app",
            "notify_email",
            "notify_sms",
            "notify_whatsapp",
            "notification_plan",
            "created_at",
        )
        read_only_fields = ("id", "email_verified", "created_at", "notification_plan")

    def get_notification_plan(self, obj) -> dict:
        from ark.reminders.services.channels import (
            FREE_CHANNELS,
            PAID_CHANNELS,
            allowed_channels,
            has_paid_plan,
        )

        return {
            "paid": has_paid_plan(obj),
            "free_channels": sorted(FREE_CHANNELS),
            "paid_channels": sorted(PAID_CHANNELS),
            "allowed": sorted(allowed_channels(obj)),
        }

    def validate(self, attrs):
        """Refuse to enable a paid channel on a free plan.

        Enforced here rather than only in the UI: the toggle is one PATCH away
        from any client, and "free account, SMS enabled" would quietly bill us
        for every reminder. Turning a channel OFF is always allowed, including
        for lapsed subscribers.
        """
        from ark.reminders.services.channels import PREFERENCE_FIELD, allowed_channels

        user = self.instance
        if user is None:
            return attrs

        entitled = allowed_channels(user)
        blocked = [
            channel
            for channel, field in PREFERENCE_FIELD.items()
            if attrs.get(field) is True and channel not in entitled
        ]
        if blocked:
            names = ", ".join(sorted(str(c.label) for c in blocked))
            raise serializers.ValidationError(
                {
                    "notification_plan": (
                        f"{names} reminders need a paid plan. "
                        "In-app notifications are free and stay on."
                    )
                }
            )
        return attrs


class CodeSerializer(serializers.Serializer):
    """A 6-digit one-time code (email verification)."""

    code = serializers.RegexField(r"^\d{6}$")


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(r"^\d{6}$")
    new_password = serializers.CharField(min_length=6)
