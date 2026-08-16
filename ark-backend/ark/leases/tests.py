from datetime import date
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from ark.payments.models import PaymentSchedule
from .models import Lease
from .services import create_lease_with_schedule, update_lease_recalculate

User = get_user_model()


@pytest.fixture
def user():
    return User.objects.create_user(email="ravi@test.com", password="pass123", name="Ravi", phone="+971501234567")


@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def lease_data():
    return {
        "building_name": "Marina Heights",
        "area": "Dubai Marina",
        "unit_number": "1205",
        "address": "1 Marina Walk, Dubai",
        "cheque_pattern": 3,
        "start_date": "2026-01-01",
        "rent_amount": "90000.00",
    }


@pytest.mark.django_db
class TestCreateLeaseService:
    def test_creates_lease_and_schedules(self, user):
        data = {
            "building_name": "Marina Heights",
            "area": "Dubai Marina",
            "unit_number": "1205",
            "address": "1 Marina Walk",
            "cheque_pattern": 3,
            "start_date": date(2026, 1, 1),
            "rent_amount": Decimal("90000.00"),
        }
        lease = create_lease_with_schedule(user, data)
        assert lease.id is not None
        assert lease.payment_schedules.count() == 3
        assert lease.payment_schedules.first().amount == Decimal("30000.00")

    def test_marks_user_onboarding_complete(self, user):
        data = {
            "building_name": "Test",
            "area": "Test",
            "unit_number": "1",
            "address": "Test",
            "cheque_pattern": 1,
            "start_date": date(2026, 1, 1),
            "rent_amount": Decimal("50000.00"),
        }
        create_lease_with_schedule(user, data)
        user.refresh_from_db()
        assert user.onboarding_complete is True


@pytest.mark.django_db
class TestUpdateLeaseService:
    def test_recalculates_future_preserves_past(self, user):
        data = {
            "building_name": "Test",
            "area": "Test",
            "unit_number": "1",
            "address": "Test",
            "cheque_pattern": 2,
            "start_date": date(2025, 1, 1),
            "rent_amount": Decimal("60000.00"),
        }
        lease = create_lease_with_schedule(user, data)
        # One cheque should be completed (past), one pending (future or past depending on date)
        initial_count = lease.payment_schedules.count()
        assert initial_count == 2

        update_lease_recalculate(lease, {"cheque_pattern": 4, "rent_amount": Decimal("80000.00")})
        lease.refresh_from_db()
        assert lease.cheque_pattern == 4
        assert lease.rent_amount == Decimal("80000.00")


@pytest.mark.django_db
class TestLeaseAPI:
    def test_create_lease(self, api_client, lease_data):
        resp = api_client.post("/api/v1/leases/create/", lease_data, format="json")
        assert resp.status_code == 201
        assert resp.data["building_name"] == "Marina Heights"
        assert len(resp.data["payment_schedules"]) == 3

    def test_list_leases(self, api_client, lease_data):
        api_client.post("/api/v1/leases/create/", lease_data, format="json")
        resp = api_client.get("/api/v1/leases/")
        assert resp.status_code == 200
        assert len(resp.data["results"]) == 1

    def test_get_lease_detail(self, api_client, lease_data):
        create_resp = api_client.post("/api/v1/leases/create/", lease_data, format="json")
        lease_id = create_resp.data["id"]
        resp = api_client.get(f"/api/v1/leases/{lease_id}/")
        assert resp.status_code == 200
        assert resp.data["id"] == lease_id

    def test_invalid_cheque_pattern(self, api_client, lease_data):
        lease_data["cheque_pattern"] = 5
        resp = api_client.post("/api/v1/leases/create/", lease_data, format="json")
        assert resp.status_code == 400

    def test_unauthenticated(self, lease_data):
        client = APIClient()
        resp = client.post("/api/v1/leases/create/", lease_data, format="json")
        assert resp.status_code == 401


@pytest.mark.django_db
class TestPaymentAPI:
    def test_list_payments(self, api_client, lease_data):
        api_client.post("/api/v1/leases/create/", lease_data, format="json")
        resp = api_client.get("/api/v1/payment-schedules/")
        assert resp.status_code == 200
        assert len(resp.data["results"]) == 3

    def test_mark_ready(self, api_client, lease_data):
        api_client.post("/api/v1/leases/create/", lease_data, format="json")
        payments = api_client.get("/api/v1/payment-schedules/").data["results"]
        # Find a pending payment
        pending = [p for p in payments if p["status"] == "pending"]
        if pending:
            resp = api_client.post(f"/api/v1/payment-schedules/{pending[0]['id']}/mark-ready/")
            assert resp.status_code == 200
            assert resp.data["status"] == "ready"

    def test_mark_ready_already_completed(self, api_client, lease_data):
        api_client.post("/api/v1/leases/create/", lease_data, format="json")
        payments = api_client.get("/api/v1/payment-schedules/").data["results"]
        completed = [p for p in payments if p["status"] == "completed"]
        if completed:
            resp = api_client.post(f"/api/v1/payment-schedules/{completed[0]['id']}/mark-ready/")
            assert resp.status_code == 400


@pytest.mark.django_db
class TestWorldwideLeases:
    """Tentzu started UAE-only. These lock in that it is not any more."""

    def test_monthly_pattern_creates_twelve_cheques_one_month_apart(self, user):
        lease = create_lease_with_schedule(
            user,
            {
                "building_name": "Bloor Tower",
                "area": "The Annex",
                "city": "Toronto",
                "country": "CA",
                "currency": "CAD",
                "unit_number": "804",
                "address": "12 Bloor St W, Toronto",
                "cheque_pattern": 12,
                "start_date": date(2026, 1, 31),
                "rent_amount": Decimal("36000.00"),
            },
        )
        schedules = list(PaymentSchedule.objects.filter(lease=lease).order_by("cheque_number"))
        assert len(schedules) == 12
        assert schedules[0].amount == Decimal("3000.00")
        assert schedules[0].due_date == date(2026, 1, 31)
        # Day-of-month must clamp, not overflow: 31 Jan + 1 month is 28 Feb.
        assert schedules[1].due_date == date(2026, 2, 28)
        assert schedules[2].due_date == date(2026, 3, 31)
        assert schedules[11].due_date == date(2026, 12, 31)

    def test_monthly_pattern_accepted_by_api(self, api_client, lease_data):
        resp = api_client.post(
            "/api/v1/leases/create/",
            {**lease_data, "cheque_pattern": 12, "country": "GB", "currency": "GBP", "city": "London"},
            format="json",
        )
        assert resp.status_code == 201, resp.data
        assert resp.data["cheque_pattern"] == 12
        assert resp.data["currency"] == "GBP"
        assert resp.data["country"] == "GB"
        assert len(resp.data["payment_schedules"]) == 12

    def test_pattern_that_does_not_divide_twelve_is_rejected(self, api_client, lease_data):
        # 5 would space cheques 12//5 = 2 months apart and silently drift.
        resp = api_client.post(
            "/api/v1/leases/create/", {**lease_data, "cheque_pattern": 5}, format="json"
        )
        assert resp.status_code == 400
        assert "cheque_pattern" in resp.data

    def test_country_and_currency_default_to_uae_for_existing_callers(self, api_client, lease_data):
        """Clients that predate the worldwide fields must keep working."""
        resp = api_client.post("/api/v1/leases/create/", lease_data, format="json")
        assert resp.status_code == 201, resp.data
        assert resp.data["country"] == "AE"
        assert resp.data["currency"] == "AED"


@pytest.mark.django_db
class TestInternationalPhones:
    @pytest.mark.parametrize(
        "phone",
        [
            "+971501234567",   # UAE — must still work
            "+14155552671",    # US
            "+14165551234",    # Canada
            "+447911123456",   # UK
            "+905301234567",   # Turkey
            "+61412345678",    # Australia
            "+4915112345678",  # Germany
            "+33612345678",    # France
        ],
    )
    def test_accepts_international_numbers(self, phone):
        user = User(email=f"u{phone[1:]}@test.com", name="T", phone=phone)
        user.full_clean(exclude=["password"])  # raises if the validator rejects

    @pytest.mark.parametrize(
        "phone",
        [
            "0501234567",      # no country code
            "+0501234567",     # country code cannot start with 0
            "971501234567",    # missing +
            "+971",            # too short
            "+9715012345678901",  # over E.164's 15 digits
            "+971 50 123 4567",   # spaces
            "not-a-phone",
        ],
    )
    def test_rejects_malformed_numbers(self, phone):
        user = User(email="bad@test.com", name="T", phone=phone)
        with pytest.raises(Exception):
            user.full_clean(exclude=["password"])


@pytest.mark.django_db
class TestAddressShapePerCountry:
    """The lease must be able to hold every country's address shape, including
    the ones with no postcode at all."""

    def test_uk_lease_has_postcode_and_no_subdivision(self, api_client, lease_data):
        resp = api_client.post(
            "/api/v1/leases/create/",
            {
                **lease_data,
                "country": "GB",
                "currency": "GBP",
                "city": "London",
                "area": "",
                "subdivision": "",
                "postal_code": "W5 4TP",
                "address": "48 Devonshire Road, London, W5 4TP, United Kingdom",
            },
            format="json",
        )
        assert resp.status_code == 201, resp.data
        assert resp.data["postal_code"] == "W5 4TP"
        assert resp.data["subdivision"] == ""

    def test_us_lease_carries_state_and_zip(self, api_client, lease_data):
        resp = api_client.post(
            "/api/v1/leases/create/",
            {
                **lease_data,
                "country": "US",
                "currency": "USD",
                "city": "Beverly Hills",
                "subdivision": "CA",
                "postal_code": "90210",
            },
            format="json",
        )
        assert resp.status_code == 201, resp.data
        assert resp.data["subdivision"] == "CA"
        assert resp.data["postal_code"] == "90210"

    def test_uae_lease_valid_with_empty_postcode(self, api_client, lease_data):
        """The UAE has no postal codes — an empty value must not be rejected."""
        resp = api_client.post(
            "/api/v1/leases/create/",
            {**lease_data, "country": "AE", "subdivision": "DU", "postal_code": ""},
            format="json",
        )
        assert resp.status_code == 201, resp.data
        assert resp.data["postal_code"] == ""
        assert resp.data["subdivision"] == "DU"

    def test_address_fields_are_optional_for_older_clients(self, api_client, lease_data):
        """An app build predating these fields must still be able to create a lease."""
        resp = api_client.post("/api/v1/leases/create/", lease_data, format="json")
        assert resp.status_code == 201, resp.data
        assert resp.data["subdivision"] == ""
        assert resp.data["postal_code"] == ""


@pytest.mark.django_db
class TestFourteenStepFields:
    """Fields collected by the new conversational steps must round-trip, and
    every one of them must be omittable — steps 6, 7, 10 and 13 are skippable,
    so a lease created without them has to succeed."""

    def test_new_fields_round_trip(self, api_client, lease_data):
        resp = api_client.post(
            "/api/v1/leases/create/",
            {
                **lease_data,
                "home_type": "villa",
                "lease_end_date": "2027-01-31",
                "contacts": [
                    {"label": "Landlord", "name": "Aisha", "phone": "+971501234567"},
                    {"label": "Maintenance", "name": "Cool Air AC", "phone": "+971504445555"},
                ],
            },
            format="json",
        )
        assert resp.status_code == 201, resp.data
        assert resp.data["home_type"] == "villa"
        assert resp.data["lease_end_date"] == "2027-01-31"
        assert len(resp.data["contacts"]) == 2
        assert resp.data["contacts"][0]["name"] == "Aisha"

    def test_all_skippable_fields_may_be_omitted(self, api_client, lease_data):
        resp = api_client.post("/api/v1/leases/create/", lease_data, format="json")
        assert resp.status_code == 201, resp.data
        assert resp.data["home_type"] == ""
        assert resp.data["lease_end_date"] is None
        assert resp.data["contacts"] == []

    def test_blank_lease_end_date_is_accepted_as_null(self, api_client, lease_data):
        """"I don't know yet" sends null, not an empty string."""
        resp = api_client.post(
            "/api/v1/leases/create/",
            {**lease_data, "lease_end_date": None, "home_type": "", "contacts": []},
            format="json",
        )
        assert resp.status_code == 201, resp.data

    def test_invalid_home_type_is_rejected(self, api_client, lease_data):
        resp = api_client.post(
            "/api/v1/leases/create/", {**lease_data, "home_type": "castle"}, format="json"
        )
        assert resp.status_code == 400
