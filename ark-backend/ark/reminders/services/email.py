"""Email notification via SendGrid."""
import logging
import time

from django.conf import settings

from .base import NotificationService

logger = logging.getLogger(__name__)


class SendGridEmailService(NotificationService):
    MAX_RETRIES = 3

    def send_reminder(self, email: str, message: str) -> bool:
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                if not settings.SENDGRID_API_KEY:
                    logger.warning("SendGrid not configured — skipping email send")
                    return False

                from sendgrid import SendGridAPIClient
                from sendgrid.helpers.mail import Mail

                sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
                mail = Mail(
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to_emails=email,
                    subject="Ark — Cheque Reminder",
                    plain_text_content=message,
                )
                sg.send(mail)
                logger.info(f"Email sent to {email} (attempt {attempt})")
                return True
            except Exception as e:
                logger.error(f"Email failed (attempt {attempt}/{self.MAX_RETRIES}): {e}")
                if attempt < self.MAX_RETRIES:
                    time.sleep(2 ** attempt)
        return False
