from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ("id", "filename", "document_type", "file_size", "content_type", "uploaded_at")
        read_only_fields = fields


class DocumentUploadRequestSerializer(serializers.Serializer):
    filename = serializers.CharField(max_length=255)
    content_type = serializers.ChoiceField(choices=["application/pdf", "image/jpeg", "image/png"])
    file_size = serializers.IntegerField(min_value=1, max_value=10 * 1024 * 1024)
    document_type = serializers.ChoiceField(choices=Document.DocType.choices, default="other")
