import re
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import models


def validate_uae_phone(value):
    """Validate UAE phone number format: +971XXXXXXXXX (9 digits after +971)."""
    if not re.match(r"^\+971\d{9}$", value):
        raise ValidationError("Phone must be in format +971XXXXXXXXX (9 digits after +971).")


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
    phone = models.CharField(max_length=15, validators=[validate_uae_phone])
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
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
