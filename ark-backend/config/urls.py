from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from .egress_diag import egress_check  # TEMPORARY — remove with egress_diag.py

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # API v1
    path("api/v1/auth/", include("ark.users.urls")),
    path("api/v1/leases/", include("ark.leases.urls")),
    path("api/v1/payment-schedules/", include("ark.payments.urls")),
    path("api/v1/reminders/", include("ark.reminders.urls")),
    path("api/v1/documents/", include("ark.documents.urls")),
    path("api/v1/billing/", include("ark.billing.urls")),
    path("api/v1/waitlist/", include("ark.waitlist.urls")),
    # TEMPORARY egress diagnostic — remove with config/egress_diag.py
    path("api/v1/_diag/egress/", egress_check),
    # OpenAPI schema
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]
