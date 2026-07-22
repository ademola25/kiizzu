from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("filename", "user", "document_type", "file_size", "uploaded_at", "deleted_at")
    list_filter = ("document_type",)
    search_fields = ("filename", "user__email")
