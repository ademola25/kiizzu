import os

from django.core import signing
from django.http import FileResponse, HttpResponse
from django.urls import reverse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import Document
from .serializers import DocumentSerializer, DocumentUploadRequestSerializer


class DocumentListView(generics.ListAPIView):
    """GET /api/v1/documents/ — List the user's (non-deleted) documents."""

    serializer_class = DocumentSerializer

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user, deleted_at__isnull=True)


class DocumentUploadView(APIView):
    """POST /api/v1/documents/upload/ — Reserve a document row and hand back a
    short-lived signed URL to PUT the bytes to."""

    def post(self, request):
        serializer = DocumentUploadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        key = services.build_storage_key(request.user.id, d["filename"])
        doc = Document.objects.create(
            user=request.user,
            filename=d["filename"],
            document_type=d["document_type"],
            s3_key=key,
            file_size=d["file_size"],
            content_type=d["content_type"],
        )
        token = services.make_token(doc.id, "put")
        upload_url = request.build_absolute_uri(reverse("document-put") + f"?t={token}")
        return Response(
            {"id": doc.id, "upload_url": upload_url, "document": DocumentSerializer(doc).data},
            status=status.HTTP_201_CREATED,
        )


class DocumentDownloadView(APIView):
    """GET /api/v1/documents/{id}/download/ — Signed URL to view the file."""

    def get(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk, user=request.user, deleted_at__isnull=True)
        except Document.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        token = services.make_token(doc.id, "get")
        url = request.build_absolute_uri(reverse("document-file") + f"?t={token}")
        return Response({"download_url": url})


class DocumentDeleteView(APIView):
    """DELETE /api/v1/documents/{id}/ — Soft-delete."""

    def delete(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk, user=request.user, deleted_at__isnull=True)
        except Document.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        doc.deleted_at = timezone.now()
        doc.save(update_fields=["deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(csrf_exempt, name="dispatch")
class DocumentPutView(View):
    """PUT /api/v1/documents/put/?t=<token> — Stream raw bytes to local storage.
    The signed token is the authorization (issued by DocumentUploadView)."""

    def put(self, request):
        try:
            doc_id = services.read_token(request.GET.get("t", ""), "put", services.UPLOAD_MAX_AGE)
        except (signing.BadSignature, signing.SignatureExpired, ValueError, TypeError):
            return HttpResponse("Invalid or expired upload link.", status=403)
        try:
            doc = Document.objects.get(pk=doc_id, deleted_at__isnull=True)
        except Document.DoesNotExist:
            return HttpResponse(status=404)

        path = services.storage_path(doc.s3_key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        # Stream from the request body (avoids DATA_UPLOAD_MAX_MEMORY_SIZE and
        # keeps memory flat for 10 MB files). Roll back the partial file if the
        # client exceeds the size limit.
        size = 0
        try:
            with open(path, "wb") as f:
                while True:
                    chunk = request.read(65536)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > services.MAX_SIZE:
                        raise ValueError("too large")
                    f.write(chunk)
        except ValueError:
            if os.path.exists(path):
                os.remove(path)
            return HttpResponse("File too large.", status=413)
        return HttpResponse(status=200)


class DocumentFileView(View):
    """GET /api/v1/documents/file/?t=<token> — Serve the stored file inline.
    Opened directly in the in-app browser, so it can't send a JWT header — the
    signed token authorizes it instead."""

    def get(self, request):
        try:
            doc_id = services.read_token(request.GET.get("t", ""), "get", services.DOWNLOAD_MAX_AGE)
        except (signing.BadSignature, signing.SignatureExpired, ValueError, TypeError):
            return HttpResponse("Invalid or expired link.", status=403)
        try:
            doc = Document.objects.get(pk=doc_id, deleted_at__isnull=True)
        except Document.DoesNotExist:
            return HttpResponse(status=404)

        path = services.storage_path(doc.s3_key)
        if not os.path.exists(path):
            return HttpResponse("File not uploaded yet.", status=404)
        resp = FileResponse(open(path, "rb"), content_type=doc.content_type)
        resp["Content-Disposition"] = f'inline; filename="{doc.filename}"'
        return resp
