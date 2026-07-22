import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status

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
