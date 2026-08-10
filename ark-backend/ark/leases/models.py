from django.conf import settings
from django.db import models


class Lease(models.Model):
    # Every value must divide 12 exactly — the schedule engine spaces cheques
    # `12 // pattern` months apart. Keep in sync with schedule_engine.ChequePattern.
    CHEQUE_PATTERN_CHOICES = [
        (1, "Annual (1 cheque)"),
        (2, "6-monthly (2 cheques)"),
        (3, "4-monthly (3 cheques)"),
        (4, "Quarterly (4 cheques)"),
        (6, "Bi-monthly (6 cheques)"),
        (12, "Monthly (12 cheques)"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="leases")
    building_name = models.CharField(max_length=255)
    # Neighbourhood / district. Optional outside the Gulf, where addresses are
    # often just street + city.
    area = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=255, blank=True)
    # State / province / emirate CODE (e.g. "ON", "TX", "DU"). Blank for the many
    # countries that do not use a subdivision in postal addresses.
    subdivision = models.CharField(max_length=8, blank=True)
    # Postcode / ZIP / Eircode / PIN. Blank for countries with no postal system
    # at all — the UAE and Hong Kong among them.
    postal_code = models.CharField(max_length=16, blank=True)
    # ISO 3166-1 alpha-2. Defaults to AE so existing Dubai leases stay correct
    # without a data migration.
    country = models.CharField(max_length=2, default="AE")
    # ISO 4217. Held per-lease rather than per-user: rent is denominated by the
    # property's country, and one person may hold leases in more than one.
    currency = models.CharField(max_length=3, default="AED")
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
