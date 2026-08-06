from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from ark.billing.models import Subscription
from .emails import EmailDeliveryError, send_code_email
from .models import OneTimeCode
from .serializers import (
    CodeSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


def _send_code(user, purpose) -> dict:
    """Issue + email a one-time code.

    A delivery failure must not fail the surrounding request — the account and the
    code are both valid, and the user can retry via resend. But it must not be
    reported as a success either, so we return `email_delivered` and let the client
    word its copy honestly.

    When EXPOSE_OTP_CODES (or DEBUG) is on we also echo the code so on-device
    testing works without a mail provider.
    """
    code = OneTimeCode.issue(user, purpose)

    delivered = True
    try:
        send_code_email(user.email, code, purpose)
    except EmailDeliveryError:
        delivered = False  # already logged with the failing backend in emails.py

    payload = {"email_delivered": delivered}
    if settings.DEBUG or getattr(settings, "EXPOSE_OTP_CODES", False):
        payload["dev_code"] = code
    return payload


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — Create new user, return JWT tokens."""
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        Subscription.objects.get_or_create(user=user)
        # Kick off email verification immediately after signup.
        extra = _send_code(user, OneTimeCode.Purpose.VERIFY_EMAIL)
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                **extra,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/v1/auth/login/ — Authenticate and return JWT tokens."""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if not user:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/v1/auth/me/ — View or update own profile."""
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """POST /api/v1/auth/logout/ — Blacklist refresh token."""

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class DeleteAccountView(APIView):
    """DELETE /api/v1/auth/me/ — Permanently delete account and all data."""

    def delete(self, request):
        user = request.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VerifyEmailView(APIView):
    """POST /api/v1/auth/email/verify/ — Confirm the current user's email with
    a 6-digit code. Requires auth (the user is signed in right after register)."""

    def post(self, request):
        serializer = CodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if user.email_verified:
            return Response(UserSerializer(user).data)
        if not OneTimeCode.redeem(
            user, OneTimeCode.Purpose.VERIFY_EMAIL, serializer.validated_data["code"]
        ):
            return Response(
                {"detail": "That code is invalid or has expired. Request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.email_verified = True
        user.save(update_fields=["email_verified"])
        return Response(UserSerializer(user).data)


class ResendVerificationView(APIView):
    """POST /api/v1/auth/email/verify/resend/ — Re-send the verification code."""

    def post(self, request):
        user = request.user
        if user.email_verified:
            return Response({"detail": "Email already verified."})
        extra = _send_code(user, OneTimeCode.Purpose.VERIFY_EMAIL)
        return Response({"detail": "Verification code sent.", **extra})


class PasswordResetRequestView(APIView):
    """POST /api/v1/auth/password/reset/ — Email a reset code. Always returns
    200 regardless of whether the address exists (no account enumeration)."""

    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        neutral = {"detail": "If that email has an account, we've sent a reset code."}
        user = User.objects.filter(email__iexact=serializer.validated_data["email"]).first()
        if user is not None:
            neutral.update(_send_code(user, OneTimeCode.Purpose.PASSWORD_RESET))
        return Response(neutral)


class PasswordResetConfirmView(APIView):
    """POST /api/v1/auth/password/reset/confirm/ — Set a new password using a
    valid reset code."""

    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = User.objects.filter(email__iexact=data["email"]).first()
        if user is None or not OneTimeCode.redeem(
            user, OneTimeCode.Purpose.PASSWORD_RESET, data["code"]
        ):
            return Response(
                {"detail": "That code is invalid or has expired. Request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(data["new_password"])
        # Resetting via an emailed code also proves ownership of the address.
        user.email_verified = True
        user.save(update_fields=["password", "email_verified"])
        return Response({"detail": "Password updated. You can now log in."})
