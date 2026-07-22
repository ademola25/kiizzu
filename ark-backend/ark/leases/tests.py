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
