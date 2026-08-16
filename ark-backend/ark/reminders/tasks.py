"""Daily reminder Celery task.

Reminder windows (30/7/1 days out) are evaluated against each tenant's OWN
local calendar day, not the server's. With users outside the Gulf, a window
computed in Asia/Dubai lands a day early or late for most of the Americas and
Australia — "1 day away" would arrive after the cheque was due.

Note: the *send hour* is still whatever the beat schedule fires at. Localising
that as well needs the beat entry to run hourly and filter on each user's local
hour. Not done here because no Celery worker is deployed yet (render.yaml has
no worker service), so this task does not currently run in production.
"""
import logging
from datetime import timedelta
from zoneinfo import ZoneInfo

from celery import shared_task
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.utils import timezone

from ark.payments.models import PaymentSchedule
from ark.reminders.models import ReminderLog
from ark.reminders.services.whatsapp import TwilioWhatsAppService
from ark.reminders.services.email import SendGridEmailService
from ark.reminders.services.sms import TwilioSMSService
from ark.reminders.services.channels import active_channels
from ark.reminders.services.inapp import build_copy

logger = logging.getLogger(__name__)

REMINDER_WINDOWS = [
    (30, "30d"),
    (7, "7d"),
    (1, "1d"),
]

whatsapp_service = TwilioWhatsAppService()
email_service = SendGridEmailService()
sms_service = TwilioSMSService()


def _local_today(tz_name: str):
    """Today's calendar date in `tz_name`, falling back to server time.

    A bad or retired zone name must not stop everyone else's reminders, so an
    unknown zone degrades to the server's date rather than raising.
    """
    now = timezone.now()
    try:
        return now.astimezone(ZoneInfo(tz_name)).date()
    except Exception:
        logger.warning("Unknown timezone %r on a user record; using server date", tz_name)
        return now.date()


@shared_task(name="reminders.send_daily_reminders")
def send_daily_reminders():
    """Send reminders for due dates hitting the 30d/7d/1d windows.

    Grouped by timezone so each tenant's window is measured against their own
    local day. Query count is bounded by the number of distinct zones in use,
    not the number of users.
    """
    total_sent = 0

    tz_names = (
        get_user_model()
        .objects.filter(is_active=True)
        .values_list("timezone", flat=True)
        .distinct()
    )

    for tz_name, days_before, reminder_type in (
        (tz, d, t) for tz in tz_names for d, t in REMINDER_WINDOWS
    ):
        target_date = _local_today(tz_name) + timedelta(days=days_before)
        flag_field = f"reminder_{reminder_type}_sent"

        payments = PaymentSchedule.objects.filter(
            due_date=target_date,
            status=PaymentSchedule.Status.PENDING,
            lease__user__timezone=tz_name,
            **{flag_field: False},
        ).select_related("lease__user")

        for payment in payments:
            user = payment.lease.user
            title, body = _build_notification(payment, days_before)
            message = f"{title}\n{body}"

            # In-app first, and unconditionally. It is free on every tier and
            # costs nothing to deliver, so it is the one channel that must
            # never be skipped — it is what guarantees a free tenant still
            # gets told. Written straight to the DB; there is nothing to send.
            _log_reminder(
                user, payment, ReminderLog.Channel.IN_APP, reminder_type,
                success=True, title=title, body=body,
            )

            # Everything else is opt-in AND plan-gated. active_channels() is
            # the intersection of the two, so a lapsed subscriber's leftover
            # preferences cannot trigger a paid send.
            channels = active_channels(user)

            if ReminderLog.Channel.WHATSAPP in channels:
                ok = whatsapp_service.send_reminder(user.phone, message)
                _log_reminder(
                    user, payment, ReminderLog.Channel.WHATSAPP, reminder_type, ok,
                    "" if ok else "Delivery failed after retries", title, body,
                )

            if ReminderLog.Channel.SMS in channels:
                ok = sms_service.send_reminder(user.phone, message)
                _log_reminder(
                    user, payment, ReminderLog.Channel.SMS, reminder_type, ok,
                    "" if ok else "Delivery failed after retries", title, body,
                )

            if ReminderLog.Channel.EMAIL in channels:
                ok = email_service.send_reminder(user.email, message)
                _log_reminder(
                    user, payment, ReminderLog.Channel.EMAIL, reminder_type, ok,
                    "" if ok else "Delivery failed after retries", title, body,
                )

            # Mark reminder as sent (idempotency flag)
            setattr(payment, flag_field, True)
            payment.save(update_fields=[flag_field, "updated_at"])
            total_sent += 1

    logger.info(f"Daily reminders complete: {total_sent} reminders processed")
    return total_sent


def _build_notification(payment, days_before):
    """(title, body) for one reminder — shared with the on-read generator.

    Split rather than one blob because the in-app feed renders them as separate
    lines. Delegates to services.inapp.build_copy so a reminder reads the same
    whether it was written by this task or materialised when the bell was
    opened; currency follows the lease, since quoting a Toronto tenant's rent
    in AED is worse than useless.
    """
    return build_copy(payment, days_before)


def _log_reminder(user, payment, channel, reminder_type, success, error_msg="", title="", body=""):
    try:
        ReminderLog.objects.create(
            user=user,
            payment_schedule=payment,
            channel=channel,
            reminder_type=reminder_type,
            status=ReminderLog.Status.SENT if success else ReminderLog.Status.FAILED,
            error_message=error_msg,
            title=title,
            body=body,
        )
    except IntegrityError:
        # Duplicate — already sent (idempotency via unique constraint)
        logger.debug(f"Reminder already logged: {channel} {reminder_type} for payment {payment.id}")
