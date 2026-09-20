"""Email reminders.

Provider order matches the auth path in ark/users/emails.py: Resend first
because it is the only transport that works on our host, SendGrid second
because the integration already existed.

Previously this was SendGrid-only, keyed on SENDGRID_API_KEY. That meant
setting RESEND_API_KEY fixed verification and password-reset mail while
reminder mail kept silently returning False — the one channel the product
exists to deliver.
"""
import logging
import time

from django.conf import settings

from ark.common.email import EmailDeliveryError, send_via_resend

from .base import NotificationService

logger = logging.getLogger(__name__)

SUBJECT = "Tentzu — Cheque Reminder"


class EmailReminderService(NotificationService):
    MAX_RETRIES = 3

    def send_reminder(self, email: str, message: str) -> bool:
        if not (settings.RESEND_API_KEY or settings.SENDGRID_API_KEY):
            logger.warning("No email provider configured — skipping reminder email")
            return False

        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                self._send(email, message)
                logger.info("Reminder email sent to %s (attempt %s)", email, attempt)
                return True
            except Exception as e:
                logger.error(
                    "Reminder email failed (attempt %s/%s): %s", attempt, self.MAX_RETRIES, e
                )
                if attempt < self.MAX_RETRIES:
                    time.sleep(2 ** attempt)
        return False

    def _send(self, email: str, message: str) -> None:
        """Raises on failure so the retry loop above can see it."""
        if settings.RESEND_API_KEY:
            send_via_resend(email, SUBJECT, message)
            return

        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        SendGridAPIClient(settings.SENDGRID_API_KEY).send(
            Mail(
                from_email=settings.DEFAULT_FROM_EMAIL,
                to_emails=email,
                subject=SUBJECT,
                plain_text_content=message,
            )
        )


# The task imported the old name; keep it resolving so nothing breaks on a
# partial deploy.
SendGridEmailService = EmailReminderService
