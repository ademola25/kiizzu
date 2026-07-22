from django.conf import settings
from django.db import models


class ReminderLog(models.Model):
    class Channel(models.TextChoices):
        WHATSAPP = "whatsapp", "WhatsApp"
        EMAIL = "email", "Email"

    class Status(models.TextChoices):
        SENT = "sent", "Sent"
        DELIVERED = "delivered", "Delivered"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reminder_logs")
    payment_schedule = models.ForeignKey("payments.PaymentSchedule", on_delete=models.CASCADE, related_name="reminder_logs")
    channel = models.CharField(max_length=20, choices=Channel.choices)
    reminder_type = models.CharField(max_length=10, help_text="30d, 7d, or 1d")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SENT)
    error_message = models.TextField(blank=True, default="")
    sent_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "reminders_reminderlog"
        ordering = ["-sent_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["payment_schedule", "channel", "reminder_type"],
                name="unique_reminder_per_cheque_channel_type",
            )
        ]

    def __str__(self):
        return f"{self.channel} {self.reminder_type} → {self.user.email} ({self.status})"
