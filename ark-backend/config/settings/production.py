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

# Django sets no socket timeout on SMTP by default, so an unreachable mail host
# blocks the worker until gunicorn SIGKILLs it — which took registration down
# with a 500 the moment EMAIL_HOST pointed somewhere that wouldn't answer.
# Sending mail must never be able to fail a request that isn't about mail.
EMAIL_TIMEOUT = env.int("EMAIL_TIMEOUT", default=10)

# Only switch to SMTP when a host AND credentials are present. A half-configured
# SMTP setup is worse than none: it cannot deliver, and it costs EMAIL_TIMEOUT
# seconds of a worker on every send attempt.
if EMAIL_HOST and EMAIL_HOST_PASSWORD:
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
