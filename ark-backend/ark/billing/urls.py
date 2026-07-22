from django.urls import path
from . import views

urlpatterns = [
    path("subscription/", views.SubscriptionView.as_view(), name="subscription"),
    path("checkout/", views.CreateCheckoutView.as_view(), name="checkout"),
    path("webhook/", views.StripeWebhookView.as_view(), name="stripe-webhook"),
]
