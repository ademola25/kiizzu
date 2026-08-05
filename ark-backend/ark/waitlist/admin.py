from django.contrib import admin

from .models import WaitlistSignup


@admin.register(WaitlistSignup)
class WaitlistSignupAdmin(admin.ModelAdmin):
    list_display = ("email", "name", "audience", "referral_count", "referral_code", "created_at")
    list_filter = ("audience", "created_at")
    search_fields = ("email", "name", "phone", "referral_code")
    readonly_fields = ("referral_code", "referral_count", "referred_by", "source", "user_agent", "created_at", "updated_at")
    ordering = ("-referral_count", "created_at")
