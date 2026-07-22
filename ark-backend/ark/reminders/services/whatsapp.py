"""WhatsApp notification via Twilio."""
import logging
import time

from django.conf import settings

from .base import NotificationService

logger = logging.getLogger(__name__)


class TwilioWhatsAppService(NotificationService):
    MAX_RETRIES = 3

    def send_reminder(self, phone: str, message: str) -> bool:
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                if not settings.TWILIO_ACCOUNT_SID:
                    logger.warning("Twilio not configured — skipping WhatsApp send")
                    return False

                from twilio.rest import Client
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                client.messages.create(
                    body=message,
                    from_=settings.TWILIO_WHATSAPP_FROM,
                    to=f"whatsapp:{phone}",
                )
                logger.info(f"WhatsApp sent to {phone} (attempt {attempt})")
                return True
            except Exception as e:
                logger.error(f"WhatsApp failed (attempt {attempt}/{self.MAX_RETRIES}): {e}")
                if attempt < self.MAX_RETRIES:
                    time.sleep(2 ** attempt)  # exponential backoff
        return False
