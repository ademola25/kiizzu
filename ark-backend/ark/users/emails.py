"""Transactional auth emails (verification + password reset codes).

Prefers SendGrid when configured (prod); otherwise falls back to Django's
configured EMAIL_BACKEND — which is the console backend in local dev, so codes
print to the runserver output and are easy to test with.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail

from .models import OneTimeCode

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


def send_code_email(to_email: str, code: str, purpose: str) -> None:
    copy = _COPY.get(purpose, _COPY[OneTimeCode.Purpose.VERIFY_EMAIL])
    body = (
        f"{copy['line']}:\n\n"
        f"    {code}\n\n"
        f"It expires in {OneTimeCode.EXPIRY_MINUTES} minutes. "
        f"If you didn't request this, you can safely ignore this email.\n\n— Tentzu"
    )

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
            "Configure SENDGRID_API_KEY or EMAIL_HOST_* to enable real delivery.",
            purpose,
            settings.EMAIL_BACKEND,
            e,
        )
        raise EmailDeliveryError(str(e)) from e
