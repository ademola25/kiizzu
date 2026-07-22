from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Document
from .serializers import DocumentSerializer, DocumentUploadRequestSerializer
from .services import generate_upload_url, generate_download_url


class DocumentListView(generics.ListAPIView):
    """GET /api/v1/documents/ — List user's documents."""
    serializer_class = DocumentSerializer

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user, deleted_at__isnull=True)


class DocumentUploadView(APIView):
    """POST /api/v1/documents/upload/ — Get presigned upload URL."""

    def post(self, request):
        serializer = DocumentUploadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            upload_url, s3_key = generate_upload_url(
                request.user.id, d["filename"], d["content_type"]
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        doc = Document.objects.create(
            user=request.user,
            filename=d["filename"],
            document_type=d["document_type"],
            s3_key=s3_key,
            file_size=d["file_size"],
            content_type=d["content_type"],
        )

        return Response({
            "id": doc.id,
            "upload_url": upload_url,
            "document": DocumentSerializer(doc).data,
        }, status=status.HTTP_201_CREATED)


class DocumentDownloadView(APIView):
    """GET /api/v1/documents/{id}/download/ — Get presigned download URL."""

    def get(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk, user=request.user, deleted_at__isnull=True)
        except Document.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        url = generate_download_url(doc.s3_key)
        return Response({"download_url": url})


class DocumentDeleteView(APIView):
    """DELETE /api/v1/documents/{id}/ — Soft-delete document."""

    def delete(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk, user=request.user, deleted_at__isnull=True)
        except Document.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        doc.deleted_at = timezone.now()
        doc.save(update_fields=["deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)
