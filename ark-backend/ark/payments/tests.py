"""Payment status: what the tenant is told, and what they can take back.

These exist because status is the one thing the app cannot get wrong. A cheque
shown as paid when it has not cleared is worse than no app at all: the tenant
stops worrying about the exact thing they installed this to worry about.
"""
from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from ark.leases.models import Lease
from ark.payments.models import PaymentSchedule

User = get_user_model()


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


def make_payment(lease, *, days, status=PaymentSchedule.Status.PENDING, number=1):
    return PaymentSchedule.objects.create(
        lease=lease,
        cheque_number=number,
        due_date=date.today() + timedelta(days=days),
        amount=Decimal("30000"),
        status=status,
    )


@pytest.mark.django_db
class TestDisplayStatus:
    def test_upcoming(self, lease):
        assert make_payment(lease, days=30).display_status == "upcoming"

    def test_due_today(self, lease):
        assert make_payment(lease, days=0).display_status == "due_today"

    def test_overdue(self, lease):
        assert make_payment(lease, days=-1).display_status == "overdue"

    def test_paid_beats_the_date(self, lease):
        """A cheque the tenant marked paid stays 'paid' even once the date passes."""
        p = make_payment(lease, days=-5, status=PaymentSchedule.Status.COMPLETED)
        assert p.display_status == "paid"

    def test_funds_ready_is_still_owed(self, lease):
        """'Funds ready' means money set aside, not money taken — it is not paid."""
        p = make_payment(lease, days=2, status=PaymentSchedule.Status.READY)
        assert p.display_status == "upcoming"


@pytest.mark.django_db
class TestListDoesNotMutate:
    def test_past_due_cheque_is_not_silently_completed(self, api_client, lease):
        """Regression: listing payments used to flip every past-due cheque to
        COMPLETED, so an unfunded cheque reported itself as paid the day after it
        was due, and 'overdue' could never be reached."""
        p = make_payment(lease, days=-3)

        res = api_client.get("/api/v1/payment-schedules/")
        assert res.status_code == 200

        p.refresh_from_db()
        assert p.status == PaymentSchedule.Status.PENDING
        rows = res.json()["results"]  # LimitOffsetPagination
        row = next(r for r in rows if r["id"] == p.id)
        assert row["display_status"] == "overdue"


@pytest.mark.django_db
class TestUndo:
    def test_undo_returns_a_paid_cheque_to_pending(self, api_client, lease):
        p = make_payment(lease, days=1)
        assert api_client.post(f"/api/v1/payment-schedules/{p.id}/mark-paid/").status_code == 200
        p.refresh_from_db()
        assert p.status == PaymentSchedule.Status.COMPLETED

        res = api_client.post(f"/api/v1/payment-schedules/{p.id}/mark-unpaid/")
        assert res.status_code == 200
        p.refresh_from_db()
        assert p.status == PaymentSchedule.Status.PENDING

    def test_undo_sticks_across_a_reload_even_when_overdue(self, api_client, lease):
        """The read-time auto-complete would have re-marked this as paid, making
        undo look like it had silently failed."""
        p = make_payment(lease, days=-2, status=PaymentSchedule.Status.COMPLETED)
        api_client.post(f"/api/v1/payment-schedules/{p.id}/mark-unpaid/")

        api_client.get("/api/v1/payment-schedules/")
        p.refresh_from_db()
        assert p.status == PaymentSchedule.Status.PENDING

    def test_cannot_undo_a_cheque_that_is_not_paid(self, api_client, lease):
        p = make_payment(lease, days=1)
        res = api_client.post(f"/api/v1/payment-schedules/{p.id}/mark-unpaid/")
        assert res.status_code == 400

    def test_undo_leaves_reminder_flags_alone(self, api_client, lease):
        """Otherwise an undo would let an already-delivered reminder fire again."""
        p = make_payment(lease, days=1, status=PaymentSchedule.Status.COMPLETED)
        PaymentSchedule.objects.filter(pk=p.pk).update(reminder_30d_sent=True, reminder_7d_sent=True)

        api_client.post(f"/api/v1/payment-schedules/{p.id}/mark-unpaid/")
        p.refresh_from_db()
        assert p.reminder_30d_sent is True
        assert p.reminder_7d_sent is True

    def test_another_users_cheque_is_not_reachable(self, lease):
        p = make_payment(lease, days=1, status=PaymentSchedule.Status.COMPLETED)
        other = User.objects.create_user(
            email="someone@else.com", password="pass123", name="Other", phone="+971509999999"
        )
        client = APIClient()
        client.force_authenticate(user=other)
        assert client.post(f"/api/v1/payment-schedules/{p.id}/mark-unpaid/").status_code == 404
