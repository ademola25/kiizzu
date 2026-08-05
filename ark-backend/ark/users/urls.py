from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", views.ProfileView.as_view(), name="profile"),
    path("me/delete/", views.DeleteAccountView.as_view(), name="delete-account"),
    # Email verification (authenticated)
    path("email/verify/", views.VerifyEmailView.as_view(), name="email-verify"),
    path("email/verify/resend/", views.ResendVerificationView.as_view(), name="email-verify-resend"),
    # Password reset (public, code-based)
    path("password/reset/", views.PasswordResetRequestView.as_view(), name="password-reset"),
    path("password/reset/confirm/", views.PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
]
