"""Date helpers shared across apps.

`local_today` lives here rather than in reminders/tasks.py because the payment
schedule needs the same answer: both "should a reminder go out today" and "is
this cheque overdue" are questions about the tenant's calendar, and two copies
of that rule would eventually disagree.
"""
import logging
from datetime import date
from zoneinfo import ZoneInfo

from django.utils import timezone

logger = logging.getLogger(__name__)


def local_today(tz_name: str) -> date:
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
