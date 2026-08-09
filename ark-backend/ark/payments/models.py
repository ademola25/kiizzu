from django.db import models


class PaymentSchedule(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        READY = "ready", "Funds Ready"
        COMPLETED = "completed", "Completed"

    lease = models.ForeignKey("leases.Lease", on_delete=models.CASCADE, related_name="payment_schedules")
    cheque_number = models.IntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reminder_30d_sent = models.BooleanField(default=False)
    reminder_7d_sent = models.BooleanField(default=False)
    reminder_1d_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments_paymentschedule"
        ordering = ["due_date"]

    def __str__(self):
        # Currency comes from the lease, not a hardcoded AED — leases exist
        # outside the UAE now.
        return f"Cheque {self.cheque_number} - {self.due_date} - {self.lease.currency} {self.amount}"
