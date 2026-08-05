"""Local document storage with short-lived signed access URLs.

Files are written under MEDIA_ROOT (local disk in dev; swap to S3/django-storages
in prod). Upload and download are gated by signed, expiring tokens, so the file
endpoints need no session/JWT — the token *is* the capability. This mirrors the
old S3 presigned-URL model, so the mobile client barely changes.
"""
import os
import uuid

from django.conf import settings
from django.core import signing

ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB
UPLOAD_MAX_AGE = 600  # 10 minutes
DOWNLOAD_MAX_AGE = 3600  # 1 hour
_SALT = "ark.documents.access"


def build_storage_key(user_id: int, filename: str) -> str:
    """Opaque per-file key stored on the Document row (the `s3_key` column)."""
    return f"documents/{user_id}/{uuid.uuid4()}/{filename}"


def storage_path(key: str) -> str:
    return os.path.join(settings.MEDIA_ROOT, key)


def make_token(doc_id: int, op: str) -> str:
    """Signed, expiring capability token for a single document + operation."""
    return signing.dumps({"id": doc_id, "op": op}, salt=_SALT)


def read_token(token: str, op: str, max_age: int) -> int:
    """Validate a token for `op`; returns the document id or raises BadSignature."""
    data = signing.loads(token, salt=_SALT, max_age=max_age)
    if data.get("op") != op:
        raise signing.BadSignature("token op mismatch")
    return int(data["id"])
