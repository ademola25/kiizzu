"""Notification channels, plan gating, and the in-app feed.

The gating tests matter more than they look: every paid channel costs real
money per send, so "free account cannot enable SMS" is a billing control, not a
UI nicety. They assert the *server* refuses it, because the toggle is one PATCH
away from any client.
"""
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from ark.billing.models import Subscription
from ark.leases.models import Lease
from ark.payments.models import PaymentSchedule
from ark.reminders.models import ReminderLog
from ark.reminders.services.channels import active_channels, allowed_channels, has_paid_plan

User = get_user_model()
Channel = ReminderLog.Channel


@pytest.fixture
def user():
    return User.objects.create_user(
        email="tenant@test.com", password="pass123", name="Tenant", phone="+971501234567"
    )


@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def lease(user):
    return Lease.objects.create(
        user=user,
        building_name="Marina Heights",
        area="Dubai Marina",
        unit_number="1203",
        address="Marina Heights, Dubai Marina, Dubai",
        cheque_pattern=4,
        start_date=date.today(),
        rent_amount=Decimal("120000"),
        currency="AED",
    )


@pytest.fixture
def payment(lease):
    return PaymentSchedule.objects.create(
        lease=lease,
        cheque_number=1,
        due_date=date.today() + timedelta(days=30),
        amount=Decimal("30000"),
    )


def make_paid(user):
    Subscription.objects.update_or_create(
        user=user, defaults={"tier": Subscription.Tier.STARTER, "active": True}
    )
    user.refresh_from_db()
    return user


# --------------------------------------------------------------------------
# Plan entitlement
# --------------------------------------------------------------------------


@pytest.mark.django_db
class TestChannelEntitlement:
    def test_free_user_gets_only_in_app(self, user):
        assert allowed_channels(user) == frozenset({Channel.IN_APP})
        assert has_paid_plan(user) is False

    def test_user_with_no_subscription_row_is_free(self, user):
        # Accounts exist before billing touches them; a missing row must not
        # be mistaken for an entitlement, and must not raise either.
        assert not Subscription.objects.filter(user=user).exists()
        assert has_paid_plan(user) is False
        assert allowed_channels(user) == frozenset({Channel.IN_APP})

    def test_paid_user_gets_every_channel(self, user):
        make_paid(user)
        assert allowed_channels(user) == frozenset(
            {Channel.IN_APP, Channel.EMAIL, Channel.SMS, Channel.WHATSAPP}
        )

    def test_cancelled_subscription_falls_back_to_free(self, user):
        Subscription.objects.create(user=user, tier=Subscription.Tier.STARTER, active=False)
        user.refresh_from_db()
        assert has_paid_plan(user) is False

    def test_active_channels_is_preference_and_entitlement(self, user):
        # Paid preferences left over from a lapsed plan must not fire.
        user.notify_sms = True
        user.notify_email = True
        user.save()
        assert active_channels(user) == frozenset({Channel.IN_APP})

        make_paid(user)
        assert active_channels(user) == frozenset({Channel.IN_APP, Channel.SMS, Channel.EMAIL})

    def test_in_app_can_be_switched_off_by_preference(self, user):
        user.notify_in_app = False
        user.save()
        assert active_channels(user) == frozenset()


# --------------------------------------------------------------------------
# Preference API
# --------------------------------------------------------------------------


@pytest.mark.django_db
class TestChannelPreferenceAPI:
    def test_me_exposes_all_four_channels(self, api_client):
        res = api_client.get("/api/v1/auth/me/")
        assert res.status_code == 200
        for field in ("notify_in_app", "notify_email", "notify_sms", "notify_whatsapp"):
            assert field in res.data

    def test_me_reports_what_the_plan_allows(self, api_client, user):
        res = api_client.get("/api/v1/auth/me/")
        assert res.data["notification_plan"]["paid"] is False
        assert res.data["notification_plan"]["allowed"] == [Channel.IN_APP]

    def test_free_user_cannot_enable_sms(self, api_client, user):
        res = api_client.patch("/api/v1/auth/me/", {"notify_sms": True}, format="json")
        assert res.status_code == 400
        user.refresh_from_db()
        assert user.notify_sms is False

    def test_free_user_cannot_enable_email_or_whatsapp(self, api_client, user):
        for field in ("notify_email", "notify_whatsapp"):
            res = api_client.patch("/api/v1/auth/me/", {field: True}, format="json")
            assert res.status_code == 400, field
        user.refresh_from_db()
        assert user.notify_email is False
        assert user.whatsapp_opted_in is False

    def test_free_user_can_toggle_in_app(self, api_client, user):
        res = api_client.patch("/api/v1/auth/me/", {"notify_in_app": False}, format="json")
        assert res.status_code == 200
        user.refresh_from_db()
        assert user.notify_in_app is False

    def test_paid_user_can_enable_paid_channels(self, api_client, user):
        make_paid(user)
        res = api_client.patch(
            "/api/v1/auth/me/",
            {"notify_sms": True, "notify_email": True, "notify_whatsapp": True},
            format="json",
        )
        assert res.status_code == 200, res.data
        user.refresh_from_db()
        assert (user.notify_sms, user.notify_email, user.whatsapp_opted_in) == (True, True, True)

    def test_turning_a_paid_channel_off_is_always_allowed(self, api_client, user):
        # A lapsed subscriber must still be able to switch things off.
        user.notify_sms = True
        user.save()
        res = api_client.patch("/api/v1/auth/me/", {"notify_sms": False}, format="json")
        assert res.status_code == 200
        user.refresh_from_db()
        assert user.notify_sms is False


# --------------------------------------------------------------------------
# In-app feed
# --------------------------------------------------------------------------


def make_note(user, payment, *, read=False, channel=Channel.IN_APP, reminder_type="30d"):
    from django.utils import timezone

    return ReminderLog.objects.create(
        user=user,
        payment_schedule=payment,
        channel=channel,
        reminder_type=reminder_type,
        title="AED 30,000 due in 30 days",
        body="Cheque 1 is due on 01 September 2026.",
        read_at=timezone.now() if read else None,
    )


@pytest.mark.django_db
class TestNotificationFeed:
    def test_feed_returns_only_in_app_rows(self, api_client, user, payment):
        make_note(user, payment, channel=Channel.IN_APP, reminder_type="30d")
        make_note(user, payment, channel=Channel.EMAIL, reminder_type="7d")
        res = api_client.get("/api/v1/reminders/notifications/")
        rows = res.data["results"] if isinstance(res.data, dict) else res.data
        assert len(rows) == 1
        assert rows[0]["channel"] == Channel.IN_APP

    def test_feed_carries_title_and_body(self, api_client, user, payment):
        make_note(user, payment)
        res = api_client.get("/api/v1/reminders/notifications/")
        rows = res.data["results"] if isinstance(res.data, dict) else res.data
        assert rows[0]["title"] == "AED 30,000 due in 30 days"
        assert rows[0]["is_read"] is False

    def test_unread_count(self, api_client, user, payment):
        make_note(user, payment, reminder_type="30d")
        make_note(user, payment, reminder_type="7d")
        make_note(user, payment, reminder_type="1d", read=True)
        res = api_client.get("/api/v1/reminders/notifications/unread-count/")
        assert res.data["unread"] == 2

    def test_mark_one_read_decrements_the_badge(self, api_client, user, payment):
        note = make_note(user, payment)
        assert api_client.post(f"/api/v1/reminders/notifications/{note.id}/read/").status_code == 204
        note.refresh_from_db()
        assert note.read_at is not None
        assert api_client.get("/api/v1/reminders/notifications/unread-count/").data["unread"] == 0

    def test_marking_read_twice_is_harmless(self, api_client, user, payment):
        note = make_note(user, payment)
        api_client.post(f"/api/v1/reminders/notifications/{note.id}/read/")
        # The list marks rows read as the user scrolls, so repeats are normal.
        assert api_client.post(f"/api/v1/reminders/notifications/{note.id}/read/").status_code == 204

    def test_mark_all_read(self, api_client, user, payment):
        make_note(user, payment, reminder_type="30d")
        make_note(user, payment, reminder_type="7d")
        res = api_client.post("/api/v1/reminders/notifications/read-all/")
        assert res.data["marked_read"] == 2
        assert api_client.get("/api/v1/reminders/notifications/unread-count/").data["unread"] == 0

    def test_cannot_read_another_users_notification(self, api_client, payment):
        other = User.objects.create_user(
            email="other@test.com", password="pass123", name="Other", phone="+971509999999"
        )
        note = make_note(other, payment)
        assert api_client.post(f"/api/v1/reminders/notifications/{note.id}/read/").status_code == 404
        note.refresh_from_db()
        assert note.read_at is None

    def test_feed_is_scoped_to_the_requesting_user(self, api_client, user, payment):
        other = User.objects.create_user(
            email="other2@test.com", password="pass123", name="Other", phone="+971508888888"
        )
        make_note(other, payment)
        res = api_client.get("/api/v1/reminders/notifications/")
        rows = res.data["results"] if isinstance(res.data, dict) else res.data
        assert rows == []

    def test_feed_requires_authentication(self, payment):
        assert APIClient().get("/api/v1/reminders/notifications/").status_code == 401


# --------------------------------------------------------------------------
# Dispatcher
# --------------------------------------------------------------------------


@pytest.mark.django_db
class TestDispatcherChannels:
    """The daily task must never send a paid channel for a free account."""

    def _run_for(self, user, payment):
        from ark.reminders.tasks import send_daily_reminders

        payment.due_date = date.today() + timedelta(days=30)
        payment.save()
        with patch("ark.reminders.tasks.whatsapp_service.send_reminder", return_value=True) as wa, \
             patch("ark.reminders.tasks.sms_service.send_reminder", return_value=True) as sms, \
             patch("ark.reminders.tasks.email_service.send_reminder", return_value=True) as em:
            send_daily_reminders()
        return wa, sms, em

    def test_free_user_gets_in_app_only(self, user, payment):
        wa, sms, em = self._run_for(user, payment)
        wa.assert_not_called()
        sms.assert_not_called()
        em.assert_not_called()
        assert ReminderLog.objects.filter(user=user, channel=Channel.IN_APP).count() == 1

    def test_in_app_entry_is_readable(self, user, payment):
        self._run_for(user, payment)
        note = ReminderLog.objects.get(user=user, channel=Channel.IN_APP)
        assert "AED" in note.title and "30 days" in note.title
        assert note.body
        assert note.read_at is None

    def test_paid_user_with_all_channels_on_gets_all(self, user, payment):
        make_paid(user)
        user.notify_email = True
        user.notify_sms = True
        user.whatsapp_opted_in = True
        user.save()
        wa, sms, em = self._run_for(user, payment)
        wa.assert_called_once()
        sms.assert_called_once()
        em.assert_called_once()
        assert ReminderLog.objects.filter(user=user, channel=Channel.IN_APP).count() == 1

    def test_paid_user_only_gets_channels_they_enabled(self, user, payment):
        make_paid(user)
        user.notify_email = True
        user.save()
        wa, sms, em = self._run_for(user, payment)
        em.assert_called_once()
        wa.assert_not_called()
        sms.assert_not_called()

    def test_stale_preferences_on_a_downgraded_account_send_nothing_paid(self, user, payment):
        # Was paid with everything on, then cancelled: preferences survive, but
        # nothing paid may fire.
        user.notify_email = True
        user.notify_sms = True
        user.whatsapp_opted_in = True
        user.save()
        Subscription.objects.create(user=user, tier=Subscription.Tier.STARTER, active=False)
        wa, sms, em = self._run_for(user, payment)
        wa.assert_not_called()
        sms.assert_not_called()
        em.assert_not_called()
        assert ReminderLog.objects.filter(user=user, channel=Channel.IN_APP).count() == 1


# --------------------------------------------------------------------------
# On-read generation
# --------------------------------------------------------------------------


@pytest.mark.django_db
class TestInAppGeneration:
    """No worker runs in production, so reading the bell must generate.

    These are the tests that matter for the free plan: without on-read
    generation the whole in-app channel is a promise with nothing behind it.
    """

    def _payment(self, lease, days_out, cheque=1):
        return PaymentSchedule.objects.create(
            lease=lease,
            cheque_number=cheque,
            due_date=date.today() + timedelta(days=days_out),
            amount=Decimal("30000"),
        )

    def test_bell_generates_when_a_window_is_reached(self, api_client, user, lease):
        self._payment(lease, 20)  # inside the 30-day window
        assert ReminderLog.objects.filter(user=user).count() == 0
        res = api_client.get("/api/v1/reminders/notifications/unread-count/")
        assert res.data["unread"] == 1

    def test_nothing_generated_before_the_first_window(self, api_client, user, lease):
        self._payment(lease, 45)  # further out than 30 days
        assert api_client.get("/api/v1/reminders/notifications/unread-count/").data["unread"] == 0

    def test_copy_reflects_real_days_remaining_not_the_window(self, api_client, user, lease):
        # Opening the app 16 days out crosses the 30-day mark, but saying
        # "due in 30 days" then would simply be false.
        self._payment(lease, 16)
        api_client.get("/api/v1/reminders/notifications/")
        note = ReminderLog.objects.get(user=user, channel=Channel.IN_APP)
        assert "16 days" in note.title
        assert "30 days" not in note.title

    def test_generation_is_idempotent_across_repeated_reads(self, api_client, user, lease):
        self._payment(lease, 20)
        for _ in range(4):
            api_client.get("/api/v1/reminders/notifications/")
            api_client.get("/api/v1/reminders/notifications/unread-count/")
        assert ReminderLog.objects.filter(user=user, channel=Channel.IN_APP).count() == 1

    def test_each_window_produces_its_own_notification(self, api_client, user, lease):
        self._payment(lease, 1)  # 30d, 7d and 1d have all been reached
        api_client.get("/api/v1/reminders/notifications/")
        types = set(
            ReminderLog.objects.filter(user=user, channel=Channel.IN_APP)
            .values_list("reminder_type", flat=True)
        )
        assert types == {"30d", "7d", "1d"}

    def test_overdue_cheque_reads_as_overdue(self, api_client, user, lease):
        self._payment(lease, -3)
        api_client.get("/api/v1/reminders/notifications/")
        titles = [n.title for n in ReminderLog.objects.filter(user=user, channel=Channel.IN_APP)]
        assert any("was due 3 days ago" in t for t in titles)

    def test_due_today_reads_as_today(self, api_client, user, lease):
        self._payment(lease, 0)
        api_client.get("/api/v1/reminders/notifications/")
        assert any(
            "due today" in n.title
            for n in ReminderLog.objects.filter(user=user, channel=Channel.IN_APP)
        )

    def test_completed_cheques_generate_nothing(self, api_client, user, lease):
        p = self._payment(lease, 5)
        p.status = PaymentSchedule.Status.COMPLETED
        p.save()
        assert api_client.get("/api/v1/reminders/notifications/unread-count/").data["unread"] == 0

    def test_only_pending_cheques_generate(self, api_client, user, lease):
        # Parity with the paid dispatcher, which also filters on PENDING: a
        # tenant who has set the funds aside has said they are sorted, and this
        # change must not quietly alter who gets nagged.
        p = self._payment(lease, 5)
        p.status = PaymentSchedule.Status.READY
        p.save()
        assert api_client.get("/api/v1/reminders/notifications/unread-count/").data["unread"] == 0

    def test_switching_in_app_off_stops_generation(self, api_client, user, lease):
        self._payment(lease, 20)
        user.notify_in_app = False
        user.save()
        assert api_client.get("/api/v1/reminders/notifications/unread-count/").data["unread"] == 0

    def test_generation_does_not_consume_the_paid_channel_flags(self, api_client, user, lease):
        # The reminder_*_sent flags are shared with the paid dispatcher. If the
        # bell set them, a paying tenant would silently lose their email/SMS.
        p = self._payment(lease, 20)
        api_client.get("/api/v1/reminders/notifications/")
        p.refresh_from_db()
        assert (p.reminder_30d_sent, p.reminder_7d_sent, p.reminder_1d_sent) == (False, False, False)

    def test_reading_then_regenerating_keeps_it_read(self, api_client, user, lease):
        self._payment(lease, 20)
        api_client.get("/api/v1/reminders/notifications/")
        api_client.post("/api/v1/reminders/notifications/read-all/")
        # A later read must not resurrect the badge with a duplicate.
        assert api_client.get("/api/v1/reminders/notifications/unread-count/").data["unread"] == 0

    def test_only_the_requesting_users_notifications_are_generated(self, api_client, user, lease):
        other = User.objects.create_user(
            email="other3@test.com", password="pass123", name="Other", phone="+971507777777"
        )
        other_lease = Lease.objects.create(
            user=other, building_name="B", area="A", unit_number="1", address="B, A",
            cheque_pattern=4, start_date=date.today(), rent_amount=Decimal("120000"), currency="AED",
        )
        PaymentSchedule.objects.create(
            lease=other_lease, cheque_number=1,
            due_date=date.today() + timedelta(days=10), amount=Decimal("30000"),
        )
        api_client.get("/api/v1/reminders/notifications/")
        assert ReminderLog.objects.filter(user=other).count() == 0
