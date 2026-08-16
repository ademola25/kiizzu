"""SMS notification via Twilio.

Same account and retry shape as the WhatsApp service — the only differences are
the `from` number and that the destination is a bare E.164 number rather than a
`whatsapp:` URI. Kept as its own class so a future move to a different SMS
provider does not have to disturb WhatsApp delivery.
"""
import logging
import time

from django.conf import settings

from .base import NotificationService

logger = logging.getLogger(__name__)


class TwilioSMSService(NotificationService):
    MAX_RETRIES = 3

    def send_reminder(self, phone: str, message: str) -> bool:
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                # Both the account and a sending number are required. Without
                # the number Twilio raises on every send, so fail fast and
                # visibly rather than burning three retries per reminder.
                if not settings.TWILIO_ACCOUNT_SID or not getattr(settings, "TWILIO_SMS_FROM", ""):
                    logger.warning("Twilio SMS not configured — skipping SMS send")
                    return False

                from twilio.rest import Client

                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                client.messages.create(
                    body=message,
                    from_=settings.TWILIO_SMS_FROM,
                    to=phone,
                )
                logger.info(f"SMS sent to {phone} (attempt {attempt})")
                return True
            except Exception as e:
                logger.error(f"SMS failed (attempt {attempt}/{self.MAX_RETRIES}): {e}")
                if attempt < self.MAX_RETRIES:
                    time.sleep(2**attempt)  # exponential backoff
        return False
