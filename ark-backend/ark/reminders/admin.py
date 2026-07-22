from django.contrib import admin
from .models import ReminderLog


@admin.register(ReminderLog)
class ReminderLogAdmin(admin.ModelAdmin):
    list_display = ("user", "channel", "reminder_type", "status", "sent_at")
    list_filter = ("channel", "status", "reminder_type")
    search_fields = ("user__email",)
    ordering = ("-sent_at",)
    readonly_fields = ("user", "payment_schedule", "channel", "reminder_type", "status", "error_message", "sent_at", "delivered_at")
