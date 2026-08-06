import secrets

from django.db import models


class WaitlistSignup(models.Model):
    REFERRAL_CODE_LENGTH = 8
    # Unambiguous uppercase set — no I/L/O/0/1, since people read these codes off a
    # screen and type them back in. 31 chars ** 8 ≈ 8.5e11 combinations.
    REFERRAL_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

    class Audience(models.TextChoices):
        TENANT = "tenant", "Tenant"
        EXPAT = "expat", "Expat relocating"
        FAMILY = "family", "Couple or family"
        FIRST_TIME_RENTER = "first_time_renter", "First-time renter"
        PROPERTY_MANAGER = "property_manager", "Property manager"
        OTHER = "other", "Other"

    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=32, blank=True)
    audience = models.CharField(max_length=32, choices=Audience.choices, default=Audience.TENANT)
    referral_code = models.CharField(max_length=16, unique=True, editable=False)
    referred_by = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="referrals",
    )
    referral_count = models.PositiveIntegerField(default=0)
    source = models.CharField(max_length=120, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-referral_count", "created_at")
        indexes = [
            models.Index(fields=["referral_code"]),
            models.Index(fields=["-referral_count", "created_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.referral_code:
            self.referral_code = self._make_referral_code()
        self.email = self.email.strip().lower()
        super().save(*args, **kwargs)

    @classmethod
    def _make_referral_code(cls):
        # Build from an explicit alphabet so the length is exact. The old version
        # took token_urlsafe(6) — 8 base64url chars — and stripped "-" and "_" out
        # of it, which shortened the code whenever either appeared. That happened
        # 1 - (62/64)**8 ≈ 23% of the time, yielding 6- and 7-character codes and
        # shrinking the keyspace on a unique column.
        while True:
            code = "".join(
                secrets.choice(cls.REFERRAL_CODE_ALPHABET)
                for _ in range(cls.REFERRAL_CODE_LENGTH)
            )
            if not cls.objects.filter(referral_code=code).exists():
                return code

    @property
    def is_founding_member(self):
        if not self.created_at:
            return False
        created_before_or_same = self.__class__.objects.filter(created_at__lte=self.created_at).count()
        return created_before_or_same <= 100

    def waitlist_position(self):
        better_ranked = self.__class__.objects.filter(referral_count__gt=self.referral_count).count()
        same_rank_before = self.__class__.objects.filter(
            referral_count=self.referral_count,
            created_at__lt=self.created_at,
        ).count()
        return better_ranked + same_rank_before + 1

    def __str__(self):
        return f"{self.name} <{self.email}>"
