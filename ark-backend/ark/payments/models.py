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

    class Display(models.TextChoices):
        """What the tenant is shown. Derived from (status, due_date) rather than
        stored, so it can never drift out of step with the date — and so a
        cheque becoming overdue needs no write."""

        PAID = "paid", "Paid"
        DUE_TODAY = "due_today", "Due Today"
        OVERDUE = "overdue", "Overdue"
        UPCOMING = "upcoming", "Upcoming"

    class Meta:
        db_table = "payments_paymentschedule"
        ordering = ["due_date"]

    @property
    def display_status(self) -> str:
        from django.utils import timezone

        if self.status == self.Status.COMPLETED:
            return self.Display.PAID
        today = timezone.now().date()
        if self.due_date < today:
            return self.Display.OVERDUE
        if self.due_date == today:
            return self.Display.DUE_TODAY
        return self.Display.UPCOMING

    def __str__(self):
        # Currency comes from the lease, not a hardcoded AED — leases exist
        # outside the UAE now.
        return f"Cheque {self.cheque_number} - {self.due_date} - {self.lease.currency} {self.amount}"
