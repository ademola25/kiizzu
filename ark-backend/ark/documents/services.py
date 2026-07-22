"""S3 presigned URL generation for document upload/download."""
import uuid
import logging

import boto3
from django.conf import settings

logger = logging.getLogger(__name__)

ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB


def generate_upload_url(user_id: int, filename: str, content_type: str) -> tuple[str, str]:
    """Generate a presigned S3 upload URL. Returns (presigned_url, s3_key)."""
    if content_type not in ALLOWED_TYPES:
        raise ValueError(f"File type '{content_type}' not allowed. Allowed: PDF, JPG, PNG.")

    s3_key = f"documents/{user_id}/{uuid.uuid4()}/{filename}"

    s3 = boto3.client(
        "s3",
        region_name=settings.AWS_S3_REGION_NAME,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

    url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
            "Key": s3_key,
            "ContentType": content_type,
        },
        ExpiresIn=600,  # 10 minutes
    )
    return url, s3_key


def generate_download_url(s3_key: str) -> str:
    """Generate a presigned S3 download URL."""
    s3 = boto3.client(
        "s3",
        region_name=settings.AWS_S3_REGION_NAME,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": s3_key},
        ExpiresIn=3600,  # 1 hour
    )
