from django.urls import path
from . import views

urlpatterns = [
    path("", views.PaymentScheduleListView.as_view(), name="payment-list"),
    path("<int:pk>/mark-ready/", views.PaymentMarkReadyView.as_view(), name="payment-mark-ready"),
    path("<int:pk>/mark-paid/", views.PaymentMarkPaidView.as_view(), name="payment-mark-paid"),
]
