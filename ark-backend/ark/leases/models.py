from django.conf import settings
from django.db import models


class Lease(models.Model):
    CHEQUE_PATTERN_CHOICES = [
        (1, "Annual (1 cheque)"),
        (2, "6-monthly (2 cheques)"),
        (3, "4-monthly (3 cheques)"),
        (4, "Quarterly (4 cheques)"),
        (6, "Bi-monthly (6 cheques)"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="leases")
    building_name = models.CharField(max_length=255)
    area = models.CharField(max_length=255)
    unit_number = models.CharField(max_length=50)
    address = models.TextField()
    cheque_pattern = models.IntegerField(choices=CHEQUE_PATTERN_CHOICES)
    start_date = models.DateField()
    rent_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "leases_lease"

    def __str__(self):
        return f"{self.building_name} #{self.unit_number} ({self.user.email})"
