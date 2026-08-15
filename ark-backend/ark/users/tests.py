import io
import json
import urllib.error
import urllib.request

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status

from ark.users.emails import EmailDeliveryError, send_code_email
from ark.users.models import OneTimeCode

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_data():
    return {
        "email": "ravi@example.com",
        "name": "Ravi Kumar",
        "phone": "+971501234567",
        "password": "testpass123",
    }


@pytest.fixture
def user(user_data):
    return User.objects.create_user(**user_data)


@pytest.mark.django_db
class TestUserModel:
    def test_create_user(self, user_data):
        user = User.objects.create_user(**user_data)
        assert user.email == user_data["email"]
        assert user.name == user_data["name"]
        assert user.phone == user_data["phone"]
        assert user.check_password(user_data["password"])
        assert not user.is_staff
        assert not user.is_superuser

    def test_create_superuser(self):
        user = User.objects.create_superuser(
            email="admin@ark.com", password="admin123", name="Admin", phone="+971509999999"
        )
        assert user.is_staff
        assert user.is_superuser

    def test_email_is_unique(self, user):
        with pytest.raises(Exception):
            User.objects.create_user(email=user.email, password="pass", name="Test", phone="+971501111111")

    def test_email_required(self):
        with pytest.raises(ValueError, match="Email is required"):
            User.objects.create_user(email="", password="pass", name="Test", phone="+971501111111")

    def test_phone_validation_valid(self):
        user = User(email="t@t.com", name="T", phone="+971501234567")
        user.set_password("testpass123")
        user.full_clean()  # should not raise

    def test_phone_validation_invalid(self):
        user = User(email="t@t.com", name="T", phone="123456")
        with pytest.raises(ValidationError):
            user.full_clean()

    def test_str(self, user):
        assert str(user) == user.email


@pytest.mark.django_db
class TestRegisterAPI:
    def test_register_success(self, api_client, user_data):
        resp = api_client.post("/api/v1/auth/register/", user_data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert "access" in resp.data
        assert "refresh" in resp.data
        assert resp.data["user"]["email"] == user_data["email"]

    def test_register_duplicate_email(self, api_client, user, user_data):
        resp = api_client.post("/api/v1/auth/register/", user_data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_invalid_phone(self, api_client, user_data):
        user_data["phone"] = "12345"
        resp = api_client.post("/api/v1/auth/register/", user_data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_short_password(self, api_client, user_data):
        user_data["password"] = "12345"
        resp = api_client.post("/api/v1/auth/register/", user_data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLoginAPI:
    def test_login_success(self, api_client, user, user_data):
        resp = api_client.post(
            "/api/v1/auth/login/",
            {"email": user_data["email"], "password": user_data["password"]},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert "access" in resp.data
        assert "refresh" in resp.data

    def test_login_wrong_password(self, api_client, user, user_data):
        resp = api_client.post(
            "/api/v1/auth/login/",
            {"email": user_data["email"], "password": "wrongpass"},
            format="json",
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_email(self, api_client):
        resp = api_client.post(
            "/api/v1/auth/login/",
            {"email": "nobody@test.com", "password": "pass"},
            format="json",
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestProfileAPI:
    def test_get_profile(self, api_client, user):
        api_client.force_authenticate(user=user)
        resp = api_client.get("/api/v1/auth/me/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["email"] == user.email

    def test_update_profile(self, api_client, user):
        api_client.force_authenticate(user=user)
        resp = api_client.patch("/api/v1/auth/me/", {"name": "New Name"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["name"] == "New Name"

    def test_profile_unauthenticated(self, api_client):
        resp = api_client.get("/api/v1/auth/me/")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestDeleteAccountAPI:
    def test_delete_account(self, api_client, user):
        api_client.force_authenticate(user=user)
        user_id = user.id
        resp = api_client.delete("/api/v1/auth/me/delete/")
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(id=user_id).exists()


@pytest.mark.django_db
class TestEmailDelivery:
    """A send that did not reach anyone must never be reported as delivered.

    This is the third time this class of bug appeared: fail_silently=True hid
    SMTP errors, then the console backend "succeeded" while delivering nothing.
    """

    def test_console_backend_is_not_reported_as_delivered(self, settings):
        settings.EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
        settings.RESEND_API_KEY = ""
        settings.SENDGRID_API_KEY = ""
        with pytest.raises(EmailDeliveryError, match="not delivered"):
            send_code_email("nobody@example.com", "123456", OneTimeCode.Purpose.VERIFY_EMAIL)

    def test_register_still_succeeds_when_delivery_fails(self, api_client, settings, user_data):
        """A broken mail provider must not fail registration — the account and
        code are valid, and the user can resend."""
        settings.EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
        settings.RESEND_API_KEY = ""
        settings.SENDGRID_API_KEY = ""
        resp = api_client.post("/api/v1/auth/register/", user_data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["email_delivered"] is False

    def test_resend_is_used_when_configured(self, settings, monkeypatch):
        settings.RESEND_API_KEY = "re_test_key"
        settings.DEFAULT_FROM_EMAIL = "noreply@tentzu.com"
        captured = {}

        class FakeResp:
            status = 200
            def __enter__(self): return self
            def __exit__(self, *a): return False

        def fake_urlopen(req, timeout=None):
            captured["url"] = req.full_url
            captured["timeout"] = timeout
            captured["auth"] = req.get_header("Authorization")
            captured["body"] = json.loads(req.data.decode())
            return FakeResp()

        monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)
        send_code_email("tenant@example.com", "654321", OneTimeCode.Purpose.VERIFY_EMAIL)

        assert captured["url"] == "https://api.resend.com/emails"
        assert captured["auth"] == "Bearer re_test_key"
        assert captured["body"]["to"] == ["tenant@example.com"]
        assert captured["body"]["from"] == "noreply@tentzu.com"
        assert "654321" in captured["body"]["text"]
        # Must be bounded — an unbounded call previously hung workers to death.
        assert captured["timeout"] is not None and captured["timeout"] <= 15

    def test_resend_failure_raises_and_does_not_fall_back(self, settings, monkeypatch):
        settings.RESEND_API_KEY = "re_test_key"

        def boom(req, timeout=None):
            raise urllib.error.HTTPError(req.full_url, 403, "Forbidden", {}, io.BytesIO(b"domain not verified"))

        monkeypatch.setattr(urllib.request, "urlopen", boom)
        with pytest.raises(EmailDeliveryError, match="403"):
            send_code_email("tenant@example.com", "111111", OneTimeCode.Purpose.VERIFY_EMAIL)


@pytest.mark.django_db
class TestFullSignupJourney:
    """The exact sequence the app performs, end to end.

    Every previous auth test exercised endpoints in isolation and passed while
    the real journey was broken: email verification succeeded, then the lease
    POST that finishOnboarding fires immediately afterwards returned 400 for
    "unit_number: This field may not be blank." The user saw an error on the
    verification screen and concluded the code was wrong.

    Test the JOURNEY, not the endpoints.
    """

    @pytest.fixture(autouse=True)
    def _expose_codes(self, settings):
        # The app relies on the server echoing the code while no mail provider
        # is configured; the journey is only testable with it on.
        settings.EXPOSE_OTP_CODES = True

    def _register(self, api_client, email):
        resp = api_client.post(
            "/api/v1/auth/register/",
            {"email": email, "name": "Journey", "phone": "+447911123456", "password": "TestPass123!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED, resp.data
        return resp.data

    def test_uk_signup_reaches_a_created_lease_without_a_unit_number(self, api_client):
        data = self._register(api_client, "journey-uk@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['access']}")

        verified = api_client.post(
            "/api/v1/auth/email/verify/", {"code": data["dev_code"]}, format="json"
        )
        assert verified.status_code == status.HTTP_200_OK, verified.data

        # Exactly what finishOnboarding posts for a UK terraced house.
        lease = api_client.post(
            "/api/v1/leases/create/",
            {
                "building_name": "48 Devonshire Road",
                "area": "",
                "city": "London",
                "subdivision": "",
                "postal_code": "W5 4TP",
                "country": "GB",
                "currency": "GBP",
                "unit_number": "",
                "address": "48 Devonshire Road, London, W5 4TP, United Kingdom",
                "cheque_pattern": 12,
                "start_date": "2026-09-01",
                "rent_amount": 24000,
            },
            format="json",
        )
        assert lease.status_code == status.HTTP_201_CREATED, lease.data
        assert len(lease.data["payment_schedules"]) == 12

    def test_uae_signup_still_works_with_a_unit_number(self, api_client):
        data = self._register(api_client, "journey-ae@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['access']}")
        api_client.post("/api/v1/auth/email/verify/", {"code": data["dev_code"]}, format="json")

        lease = api_client.post(
            "/api/v1/leases/create/",
            {
                "building_name": "Marina Heights",
                "area": "Dubai Marina",
                "city": "Dubai",
                "subdivision": "DU",
                "postal_code": "",
                "country": "AE",
                "currency": "AED",
                "unit_number": "1205",
                "address": "Unit 1205, Marina Heights, Dubai Marina, Dubai",
                "cheque_pattern": 4,
                "start_date": "2026-09-01",
                "rent_amount": 90000,
            },
            format="json",
        )
        assert lease.status_code == status.HTTP_201_CREATED, lease.data

    def test_every_optional_address_field_can_be_blank_at_once(self, api_client):
        """The minimum a country like Hong Kong or a bare street address needs."""
        data = self._register(api_client, "journey-min@example.com")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['access']}")
        api_client.post("/api/v1/auth/email/verify/", {"code": data["dev_code"]}, format="json")

        lease = api_client.post(
            "/api/v1/leases/create/",
            {
                "building_name": "12 Queen's Road East",
                "area": "",
                "city": "Wan Chai",
                "subdivision": "",
                "postal_code": "",
                "country": "HK",
                "currency": "HKD",
                "unit_number": "",
                "address": "12 Queen's Road East, Wan Chai, Hong Kong",
                "cheque_pattern": 12,
                "start_date": "2026-09-01",
                "rent_amount": 120000,
            },
            format="json",
        )
        assert lease.status_code == status.HTTP_201_CREATED, lease.data
