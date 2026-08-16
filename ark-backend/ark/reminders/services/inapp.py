"""In-app notifications, generated on read.

An in-app notification is only ever *consumed* when the tenant opens the app.
Generating it at that moment is therefore observationally identical to having a
scheduler write it overnight — and it needs no Celery worker, no Redis and no
paid cron job, none of which the free tier has. Push channels (email, SMS,
WhatsApp) genuinely need a scheduler, because they must leave the building
whether or not anyone is looking; in-app does not.

Without this the free plan would be a promise with nothing behind it: the
dispatcher that writes in-app rows is a Celery task, and render.yaml deploys a
single web service, so the bell would have sat at zero forever.

Idempotency comes from the unique constraint on
(payment_schedule, channel, reminder_type) — deliberately NOT from the
``reminder_*_sent`` flags on PaymentSchedule. Those flags are shared with the
paid-channel dispatcher, and setting them here would make a future worker skip
sending the email and SMS a paying tenant is owed.
"""

import logging
from datetime import timedelta
from zoneinfo import ZoneInfo

from django.db import IntegrityError
from django.utils import timezone

from ark.payments.models import PaymentSchedule
from ark.reminders.models import ReminderLog

logger = logging.getLogger(__name__)

#: Each window is a *band*, not a threshold: (upper, lower, label), meaning
#: "lower < days_until <= upper". The 1-day band has no lower bound so it also
#: catches due-today and overdue.
#:
#: Bands rather than "days_until <= window" because a tenant whose first look at
#: the app is the day before a cheque has technically crossed all three marks.
#: With thresholds that produced three notifications at once, all reading
#: "due in 1 day" — verified against production, and it looked broken. A band
#: yields exactly one notification per stage: the one that is true now.
WINDOWS = [(30, 7, "30d"), (7, 1, "7d"), (1, None, "1d")]


def _local_today(tz_name: str):
    """Today in the tenant's own zone, degrading to server time if it is bad."""
    now = timezone.now()
    try:
        return now.astimezone(ZoneInfo(tz_name)).date()
    except Exception:
        logger.warning("Unknown timezone %r on a user record; using server date", tz_name)
        return now.date()


def build_copy(payment, days_until: int):
    """(title, body) describing this cheque, right now.

    Copy is computed from the *actual* days remaining rather than from the
    window that triggered it. A tenant who opens the app for the first time
    sixteen days before a cheque has technically crossed the 30-day mark, and
    telling them "due in 30 days" then would simply be false. The window still
    decides *whether* to speak; the clock decides *what* to say.
    """
    amount = f"{payment.lease.currency} {payment.amount:,.0f}"
    date_str = payment.due_date.strftime("%d %B %Y")

    if days_until < 0:
        overdue = abs(days_until)
        title = f"{amount} was due {overdue} day{'s' if overdue != 1 else ''} ago"
        body = f"Cheque {payment.cheque_number} was due on {date_str}."
    elif days_until == 0:
        title = f"{amount} is due today"
        body = f"Cheque {payment.cheque_number} is due today, {date_str}."
    else:
        title = f"{amount} due in {days_until} day{'s' if days_until != 1 else ''}"
        body = (
            f"Cheque {payment.cheque_number} is due on {date_str}. "
            "Make sure the funds are ready."
        )
    return title, body


def sync_in_app_notifications(user) -> int:
    """Create any in-app notifications this tenant has earned. Returns the count.

    Called from the feed and the unread-count endpoint, so the bell is correct
    the moment it is looked at.
    """
    if not user.notify_in_app:
        return 0

    today = _local_today(user.timezone)

    payments = list(
        PaymentSchedule.objects.filter(
            lease__user=user,
            status=PaymentSchedule.Status.PENDING,
        ).select_related("lease")
    )
    if not payments:
        return 0

    # One query for everything already written, rather than a get_or_create per
    # (payment × window) — that would be four round-trips per cheque on a path
    # the app hits every time the bell renders.
    already = set(
        ReminderLog.objects.filter(
            user=user,
            channel=ReminderLog.Channel.IN_APP,
            payment_schedule__in=payments,
        ).values_list("payment_schedule_id", "reminder_type")
    )

    rows = []
    for payment in payments:
        days_until = (payment.due_date - today).days
        for upper, lower, reminder_type in WINDOWS:
            if days_until > upper:
                continue  # too early to say anything about this stage
            if lower is not None and days_until <= lower:
                continue  # a later, more urgent stage owns this moment
            if (payment.id, reminder_type) in already:
                continue
            title, body = build_copy(payment, days_until)
            rows.append(
                ReminderLog(
                    user=user,
                    payment_schedule=payment,
                    channel=ReminderLog.Channel.IN_APP,
                    reminder_type=reminder_type,
                    status=ReminderLog.Status.SENT,
                    title=title,
                    body=body,
                )
            )

    if not rows:
        return 0

    try:
        # ignore_conflicts: two devices can open the app at the same instant and
        # both find the same window unwritten. The unique constraint settles it;
        # neither request should 500 over a duplicate notification.
        ReminderLog.objects.bulk_create(rows, ignore_conflicts=True)
    except IntegrityError:
        logger.debug("Concurrent in-app notification sync for user %s", user.pk)
        return 0
    return len(rows)
