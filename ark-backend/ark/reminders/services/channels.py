"""Which reminder channels a given user may actually use.

One module answers this, and everything else asks it: the preference endpoint,
the reminder dispatcher, and the tests. When "is this channel allowed?" is
re-derived at each call site they drift, and the drift is invisible until a
free account is quietly billed for an SMS.

The rule: **in-app is free, everything else is paid.** In-app costs us nothing
to deliver, so it is the one channel a free tenant can always rely on — the
product still works without paying, it just reaches you only inside the app.
"""

from ark.reminders.models import ReminderLog

Channel = ReminderLog.Channel

#: Free for every account, on any tier.
FREE_CHANNELS = frozenset({Channel.IN_APP})

#: Require an active paid subscription.
PAID_CHANNELS = frozenset({Channel.EMAIL, Channel.SMS, Channel.WHATSAPP})

ALL_CHANNELS = FREE_CHANNELS | PAID_CHANNELS

#: Channel -> the User field holding that channel's preference.
PREFERENCE_FIELD = {
    Channel.IN_APP: "notify_in_app",
    Channel.EMAIL: "notify_email",
    Channel.SMS: "notify_sms",
    Channel.WHATSAPP: "whatsapp_opted_in",
}


def has_paid_plan(user) -> bool:
    """True when the user has an active, non-free subscription.

    Missing subscription rows are treated as free rather than as an error:
    accounts are created before billing ever touches them, and a tenant with no
    Subscription row must not be handed paid channels by accident.
    """
    sub = getattr(user, "subscription", None)
    if sub is None:
        return False
    from ark.billing.models import Subscription

    return bool(sub.active and sub.tier != Subscription.Tier.FREE)


def allowed_channels(user) -> frozenset:
    """Channels this user's plan entitles them to — ignoring preferences."""
    return ALL_CHANNELS if has_paid_plan(user) else FREE_CHANNELS


def active_channels(user) -> frozenset:
    """Channels we should actually send on: wanted AND entitled.

    The intersection is deliberate. A tenant who pays, turns SMS on, then
    downgrades still has ``notify_sms=True`` on their record — we keep the
    preference so it comes back if they resubscribe, but we must not act on it
    while they are free.
    """
    entitled = allowed_channels(user)
    return frozenset(
        channel
        for channel in entitled
        if getattr(user, PREFERENCE_FIELD[channel], False)
    )
