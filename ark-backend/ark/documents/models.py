from django.conf import settings
from django.db import models


class Document(models.Model):
    class DocType(models.TextChoices):
        LEASE = "lease", "Tenancy Contract"
        EJARI = "ejari", "Ejari Certificate"
        EMIRATES_ID = "emirates_id", "Emirates ID"
        PASSPORT = "passport", "Passport"
        LICENSE = "license", "Driver's License"
        OTHER = "other", "Other"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="documents")
    filename = models.CharField(max_length=255)
    document_type = models.CharField(max_length=20, choices=DocType.choices, default=DocType.OTHER)
    s3_key = models.CharField(max_length=500)
    file_size = models.IntegerField(help_text="File size in bytes")
    content_type = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "documents_document"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.filename} ({self.user.email})"

    @property
    def is_deleted(self):
        return self.deleted_at is not None
