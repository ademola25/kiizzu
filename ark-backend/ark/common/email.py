"""Resend HTTPS transport, shared by auth email and reminder email.

Render blocks outbound SMTP, so an HTTPS API is the whole delivery story. This
lives in common/ so both senders use one implementation rather than two that
can drift — the same reason local_today moved here.
"""
import json
import logging
import urllib.error
import urllib.request

from django.conf import settings

# Bounded on purpose: Django sets no socket timeout, and an unreachable mail
# host previously hung workers until gunicorn killed them, 500-ing registration.
HTTP_TIMEOUT = 10

logger = logging.getLogger(__name__)


class EmailDeliveryError(Exception):
    """Raised when an email could not be delivered.

    Callers must not be able to mistake a failed send for a successful one,
    which is what fail_silently=True allowed before this existed.
    """


def send_via_resend(to_email: str, subject: str, body: str) -> None:
    """POST to Resend's HTTPS API. Raises on any non-2xx or transport error."""
    payload = json.dumps(
        {
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "text": body,
        }
    ).encode()
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
            if not 200 <= resp.status < 300:
                raise EmailDeliveryError(f"Resend returned HTTP {resp.status}")
    except urllib.error.HTTPError as e:
        # Resend puts the actual reason in the body — an unverified sending
        # domain shows up here, and it is the most likely first failure.
        detail = e.read().decode(errors="replace")[:300]
        raise EmailDeliveryError(f"Resend HTTP {e.code}: {detail}") from e
    except EmailDeliveryError:
        raise
    except Exception as e:
        raise EmailDeliveryError(f"Resend request failed: {e}") from e
