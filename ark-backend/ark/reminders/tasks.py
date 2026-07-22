"""Daily reminder Celery task — runs at 6:00 AM Asia/Dubai."""
import logging
from datetime import timedelta

from celery import shared_task
from django.db import IntegrityError
from django.utils import timezone

from ark.payments.models import PaymentSchedule
from ark.reminders.models import ReminderLog
from ark.reminders.services.whatsapp import TwilioWhatsAppService
from ark.reminders.services.email import SendGridEmailService

logger = logging.getLogger(__name__)

REMINDER_WINDOWS = [
    (30, "30d"),
    (7, "7d"),
    (1, "1d"),
]

whatsapp_service = TwilioWhatsAppService()
email_service = SendGridEmailService()


@shared_task(name="reminders.send_daily_reminders")
def send_daily_reminders():
    """Check all payment schedules and send reminders for due dates hitting 30d/7d/1d windows."""
    today = timezone.now().date()
    total_sent = 0

    for days_before, reminder_type in REMINDER_WINDOWS:
        target_date = today + timedelta(days=days_before)
        flag_field = f"reminder_{reminder_type}_sent"

        payments = PaymentSchedule.objects.filter(
            due_date=target_date,
            status=PaymentSchedule.Status.PENDING,
            **{flag_field: False},
        ).select_related("lease__user")

        for payment in payments:
            user = payment.lease.user
            message = _build_message(payment, days_before)

            sent_via = None

            # Try WhatsApp first (if user opted in and has Starter+ tier — tier check deferred to Epic 7)
            if user.whatsapp_opted_in:
                success = whatsapp_service.send_reminder(user.phone, message)
                if success:
                    _log_reminder(user, payment, ReminderLog.Channel.WHATSAPP, reminder_type, True)
                    sent_via = "whatsapp"
                else:
                    _log_reminder(user, payment, ReminderLog.Channel.WHATSAPP, reminder_type, False, "Delivery failed after retries")
                    # Fallback to email
                    email_success = email_service.send_reminder(user.email, message)
                    _log_reminder(user, payment, ReminderLog.Channel.EMAIL, reminder_type, email_success,
                                  "" if email_success else "Email fallback also failed")
                    if email_success:
                        sent_via = "email (fallback)"

            # Always send email (primary for Free tier, or in addition to WhatsApp)
            if sent_via != "whatsapp":
                if sent_via != "email (fallback)":
                    email_success = email_service.send_reminder(user.email, message)
                    _log_reminder(user, payment, ReminderLog.Channel.EMAIL, reminder_type, email_success)

            # Mark reminder as sent (idempotency flag)
            setattr(payment, flag_field, True)
            payment.save(update_fields=[flag_field, "updated_at"])
            total_sent += 1

    logger.info(f"Daily reminders complete: {total_sent} reminders processed")
    return total_sent


def _build_message(payment, days_before):
    amount = f"AED {payment.amount:,.2f}"
    date_str = payment.due_date.strftime("%d %B %Y")
    return (
        f"🏠 Ark Reminder\n"
        f"Your rent cheque of {amount} is due on {date_str} "
        f"— {days_before} day{'s' if days_before != 1 else ''} away. "
        f"Make sure funds are ready."
    )


def _log_reminder(user, payment, channel, reminder_type, success, error_msg=""):
    try:
        ReminderLog.objects.create(
            user=user,
            payment_schedule=payment,
            channel=channel,
            reminder_type=reminder_type,
            status=ReminderLog.Status.SENT if success else ReminderLog.Status.FAILED,
            error_message=error_msg,
        )
    except IntegrityError:
        # Duplicate — already sent (idempotency via unique constraint)
        logger.debug(f"Reminder already logged: {channel} {reminder_type} for payment {payment.id}")
