from django.contrib import admin
from .models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "tier", "active", "created_at")
    list_filter = ("tier", "active")
    search_fields = ("user__email",)
