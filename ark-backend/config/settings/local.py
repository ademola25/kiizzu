"""Local development settings."""
from .base import *  # noqa: F401, F403

DEBUG = True
# "*" lets physical devices (Expo Go on a phone) reach the dev server over the
# LAN by IP without re-listing the IP every time it changes. Local dev only.
ALLOWED_HOSTS = ["*"]

# Debug toolbar
INSTALLED_APPS += ["debug_toolbar"]  # noqa: F405
MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")  # noqa: F405
INTERNAL_IPS = ["127.0.0.1"]

# Email — console backend for local dev
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# CORS — allow all in dev
CORS_ALLOW_ALL_ORIGINS = True
