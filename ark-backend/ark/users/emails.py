"""Transactional auth emails (verification + password reset codes).

Provider order: Resend, then SendGrid, then Django's configured EMAIL_BACKEND.

Resend is first because it is what works on our host — Render blocks outbound
SMTP entirely (measured: smtp.* unreachable, api.resend.com:443 connects in
0.01s), so only an HTTPS-API provider can deliver. SendGrid is kept because the
integration already existed, though its free plan was retired in 2025.

Anything that cannot actually deliver raises EmailDeliveryError. In particular
the console backend prints the message and delivers nothing, so it must not be
reported as a successful send.
"""
import json
import logging
import urllib.error
import urllib.request

from django.conf import settings
from django.core.mail import send_mail

from .models import OneTimeCode

# Never block a request on the mail provider. Django applies no default socket
# timeout, and an unreachable host previously hung workers until gunicorn killed
# them, 500-ing registration. Every outbound call here is bounded.
_HTTP_TIMEOUT = 10

logger = logging.getLogger(__name__)


class EmailDeliveryError(Exception):
    """Raised when a code email could not be delivered.

    Callers must decide how to respond — the important thing is that they cannot
    mistake a failed send for a successful one, which is what fail_silently=True
    allowed for every send before this existed.
    """

_COPY = {
    OneTimeCode.Purpose.VERIFY_EMAIL: {
        "subject": "Your Tentzu verification code",
        "line": "Welcome to Tentzu! Use this code to verify your email",
    },
    OneTimeCode.Purpose.PASSWORD_RESET: {
        "subject": "Reset your Tentzu password",
        "line": "Use this code to reset your Tentzu password",
    },
}


def _send_via_resend(to_email: str, subject: str, body: str) -> None:
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
        with urllib.request.urlopen(req, timeout=_HTTP_TIMEOUT) as resp:
            if not 200 <= resp.status < 300:
                raise EmailDeliveryError(f"Resend returned HTTP {resp.status}")
    except urllib.error.HTTPError as e:
        # Resend puts the actual reason in the body — an unverified sending
        # domain shows up here, and it is the most likely first failure.
        detail = e.read().decode(errors="replace")[:300]
        raise EmailDeliveryError(f"Resend HTTP {e.code}: {detail}") from e
    except Exception as e:
        raise EmailDeliveryError(f"Resend request failed: {e}") from e


def send_code_email(to_email: str, code: str, purpose: str) -> None:
    copy = _COPY.get(purpose, _COPY[OneTimeCode.Purpose.VERIFY_EMAIL])
    body = (
        f"{copy['line']}:\n\n"
        f"    {code}\n\n"
        f"It expires in {OneTimeCode.EXPIRY_MINUTES} minutes. "
        f"If you didn't request this, you can safely ignore this email.\n\n— Tentzu"
    )

    if settings.RESEND_API_KEY:
        try:
            _send_via_resend(to_email, copy["subject"], body)
            return
        except EmailDeliveryError as e:
            # Do NOT fall through to the console backend on failure — that would
            # print the mail locally and report it as delivered.
            logger.error("Resend delivery FAILED for purpose=%s: %s", purpose, e)
            raise

    if settings.SENDGRID_API_KEY:
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail

            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            sg.send(
                Mail(
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to_emails=to_email,
                    subject=copy["subject"],
                    plain_text_content=body,
                )
            )
            return
        except Exception as e:  # pragma: no cover - network path
            logger.error(f"SendGrid auth email failed, falling back to backend: {e}")

    # fail_silently=False so a broken transport is visible in the logs. It used to
    # be True, which meant every failed send looked identical to a successful one —
    # the API kept reporting "we've sent a code" while nothing was ever delivered.
    # The caller decides what to do with the failure; it must not surface a success
    # message for a send that did not happen.
    try:
        send_mail(
            subject=copy["subject"],
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(
            "Auth email delivery FAILED for purpose=%s via backend=%s: %s. "
            "Configure RESEND_API_KEY (preferred) or SENDGRID_API_KEY to enable "
            "real delivery.",
            purpose,
            settings.EMAIL_BACKEND,
            e,
        )
        raise EmailDeliveryError(str(e)) from e

    # send_mail() succeeded — but the console backend "succeeds" by printing to
    # stdout, having delivered nothing. Reporting that as a send is the same false
    # claim as the old fail_silently=True, one layer down: the API would answer
    # email_delivered: true while the user's inbox stayed empty.
    if "console" in settings.EMAIL_BACKEND:
        raise EmailDeliveryError(
            "console EMAIL_BACKEND: message logged, not delivered — "
            "set RESEND_API_KEY to send for real"
        )
