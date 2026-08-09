import re
import secrets
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


def validate_international_phone(value):
    """Validate an E.164 international phone number: +<country code><number>.

    E.164 allows at most 15 digits in total and the first digit of a country
    code is never 0, which is what the pattern below encodes. We deliberately
    do NOT validate per-country number lengths: those rules change, vary by
    carrier, and getting them wrong locks real users out of signing up. The
    delivery provider is the authority on whether a number is reachable.

    Replaces the old UAE-only +971XXXXXXXXX rule — Tentzu is no longer
    Dubai-only, and that pattern rejected every non-UAE tenant.
    """
    if not re.match(r"^\+[1-9]\d{7,14}$", value):
        raise ValidationError(
            "Enter the number in international format, starting with + and the "
            "country code — for example +14155552671 or +971501234567."
        )


# Old name kept so historical migrations that reference it still import.
# Django serialises validators into migration files by path, and 0001_initial
# names this function; renaming it outright breaks `migrate` on a fresh DB.
validate_uae_phone = validate_international_phone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    # 16 chars: E.164 permits 15 digits plus the leading "+".
    phone = models.CharField(max_length=16, validators=[validate_international_phone])
    # IANA zone (e.g. "Europe/London", "America/Toronto"). Reminders are only
    # meaningful in the tenant's own local calendar — a 30-day warning computed
    # in Asia/Dubai lands a day out for most of the Americas.
    timezone = models.CharField(max_length=64, default="Asia/Dubai")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    onboarding_complete = models.BooleanField(default=False)
    whatsapp_opted_in = models.BooleanField(default=False)
    whatsapp_opted_in_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name", "phone"]

    class Meta:
        db_table = "users_user"

    def __str__(self):
        return self.email


class OneTimeCode(models.Model):
    """Short-lived, hashed numeric code for email verification and password
    reset. Codes are single-use, expire quickly, and are attempt-limited so a
    6-digit code can't be brute-forced."""

    CODE_LENGTH = 6
    EXPIRY_MINUTES = 15
    MAX_ATTEMPTS = 6

    class Purpose(models.TextChoices):
        VERIFY_EMAIL = "verify_email", "Verify email"
        PASSWORD_RESET = "password_reset", "Password reset"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="otp_codes")
    purpose = models.CharField(max_length=20, choices=Purpose.choices)
    code_hash = models.CharField(max_length=256)
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["user", "purpose", "consumed_at"])]
        ordering = ("-created_at",)

    @classmethod
    def issue(cls, user, purpose) -> str:
        """Invalidate any outstanding codes for this purpose and mint a fresh
        one. Returns the raw code (to be emailed — never stored in the clear)."""
        cls.objects.filter(user=user, purpose=purpose, consumed_at__isnull=True).delete()
        raw = f"{secrets.randbelow(10 ** cls.CODE_LENGTH):0{cls.CODE_LENGTH}d}"
        cls.objects.create(
            user=user,
            purpose=purpose,
            code_hash=make_password(raw),
            expires_at=timezone.now() + timedelta(minutes=cls.EXPIRY_MINUTES),
        )
        return raw

    @classmethod
    def redeem(cls, user, purpose, raw: str) -> bool:
        """Validate `raw` against the newest active code. Consumes it on success.
        Returns False for missing / expired / exhausted / mismatched codes."""
        code = (
            cls.objects.filter(user=user, purpose=purpose, consumed_at__isnull=True)
            .order_by("-created_at")
            .first()
        )
        if code is None or timezone.now() > code.expires_at:
            return False
        if code.attempts >= cls.MAX_ATTEMPTS:
            return False
        code.attempts += 1
        if check_password(raw, code.code_hash):
            code.consumed_at = timezone.now()
            code.save(update_fields=["attempts", "consumed_at"])
            return True
        code.save(update_fields=["attempts"])
        return False
