from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "name", "phone", "onboarding_complete", "is_active", "created_at")
    list_filter = ("is_active", "onboarding_complete", "whatsapp_opted_in")
    search_fields = ("email", "name", "phone")
    ordering = ("-created_at",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("name", "phone")}),
        ("Status", {"fields": ("onboarding_complete", "whatsapp_opted_in", "whatsapp_opted_in_at")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "name", "phone", "password1", "password2")}),
    )
