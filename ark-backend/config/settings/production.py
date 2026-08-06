"""Production settings."""
from .base import *  # noqa: F401, F403
from .base import env

# Email
# Django's default EMAIL_BACKEND is SMTP against localhost:25. There is no such
# server on Render, so every send raised — and emails.py swallowed it with
# fail_silently=True, which is why "we sent you a code" was silently false for
# every user. Make the transport explicit instead of inherited.
#
# Two supported routes:
#   1. SENDGRID_API_KEY set  -> emails.py uses the SendGrid HTTP API directly.
#   2. EMAIL_HOST_* set      -> standard SMTP (Resend, Mailgun, Gmail app password…).
# With neither configured we use the console backend, which logs the message
# rather than pretending to deliver it. Codes still reach testers through the
# EXPOSE_OTP_CODES response field.
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)

if EMAIL_HOST:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Security
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
