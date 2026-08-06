import pytest
from rest_framework.test import APIClient

from ark.waitlist.models import WaitlistSignup


@pytest.mark.django_db
class TestWaitlistSignup:
    def setup_method(self):
        self.client = APIClient()

    def test_create_waitlist_signup(self):
        response = self.client.post(
            "/api/v1/waitlist/",
            {
                "name": "Amina Khan",
                "email": "AMINA@example.com",
                "phone": "+971501111111",
                "audience": "tenant",
            },
            format="json",
        )

        assert response.status_code == 201
        assert response.data["email"] == "amina@example.com"
        assert response.data["position"] == 1
        assert response.data["referrals"] == 0
        assert response.data["founding_member"] is True
        assert len(response.data["referral_code"]) == 8

    def test_referral_code_is_always_exactly_eight_chars(self):
        """Regression: codes were built by stripping "-"/"_" out of
        token_urlsafe(6), which shortened them ~23% of the time. A single
        signup only caught that on roughly one run in four, so generate
        enough codes that a length bug cannot slip through."""
        codes = [WaitlistSignup._make_referral_code() for _ in range(200)]

        wrong_length = {c for c in codes if len(c) != WaitlistSignup.REFERRAL_CODE_LENGTH}
        assert not wrong_length, f"codes with wrong length: {sorted(wrong_length)}"

        allowed = set(WaitlistSignup.REFERRAL_CODE_ALPHABET)
        assert all(set(c) <= allowed for c in codes)
        # Ambiguous glyphs must never appear — these get read aloud and retyped.
        assert not (set("".join(codes)) & set("ILO01"))

    def test_duplicate_email_returns_existing_signup(self):
        first = self.client.post(
            "/api/v1/waitlist/",
            {"name": "Amina", "email": "amina@example.com", "audience": "tenant"},
            format="json",
        )
        second = self.client.post(
            "/api/v1/waitlist/",
            {"name": "Amina K", "email": "AMINA@example.com", "audience": "expat"},
            format="json",
        )

        assert first.status_code == 201
        assert second.status_code == 201
        assert second.data["referral_code"] == first.data["referral_code"]
        assert WaitlistSignup.objects.count() == 1
        assert WaitlistSignup.objects.get().name == "Amina K"

    def test_referral_increments_referrer_and_improves_position(self):
        referrer = self.client.post(
            "/api/v1/waitlist/",
            {"name": "Maya", "email": "maya@example.com", "audience": "tenant"},
            format="json",
        )
        referred = self.client.post(
            "/api/v1/waitlist/",
            {
                "name": "Omar",
                "email": "omar@example.com",
                "audience": "first_time_renter",
                "referral": referrer.data["referral_code"],
            },
            format="json",
        )

        assert referred.status_code == 201
        assert WaitlistSignup.objects.get(email="maya@example.com").referral_count == 1

        refreshed = self.client.post(
            "/api/v1/waitlist/",
            {"name": "Maya", "email": "maya@example.com", "audience": "tenant"},
            format="json",
        )
        assert refreshed.data["position"] == 1
        assert refreshed.data["referrals"] == 1
