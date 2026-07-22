import logging

import stripe
from django.conf import settings
from django.http import HttpResponse
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Subscription
from .serializers import SubscriptionSerializer

logger = logging.getLogger(__name__)


class SubscriptionView(APIView):
    """GET /api/v1/billing/subscription/ — Get current subscription."""

    def get(self, request):
        sub, _ = Subscription.objects.get_or_create(user=request.user)
        return Response(SubscriptionSerializer(sub).data)


class CreateCheckoutView(APIView):
    """POST /api/v1/billing/checkout/ — Create Stripe checkout session."""

    def post(self, request):
        if not settings.STRIPE_SECRET_KEY:
            return Response({"detail": "Billing not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        tier = request.data.get("tier", "starter")
        stripe.api_key = settings.STRIPE_SECRET_KEY

        # Price IDs would be configured per tier — placeholder
        price_map = {
            "starter": "price_starter_placeholder",
            "pro": "price_pro_placeholder",
        }
        price_id = price_map.get(tier)
        if not price_id:
            return Response({"detail": "Invalid tier."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = stripe.checkout.Session.create(
                customer_email=request.user.email,
                payment_method_types=["card"],
                line_items=[{"price": price_id, "quantity": 1}],
                mode="subscription",
                success_url=request.data.get("success_url", "http://localhost:5173/settings?billing=success"),
                cancel_url=request.data.get("cancel_url", "http://localhost:5173/settings?billing=cancel"),
            )
            return Response({"checkout_url": session.url})
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {e}")
            return Response({"detail": "Payment service error."}, status=status.HTTP_502_BAD_GATEWAY)


class StripeWebhookView(APIView):
    """POST /api/v1/billing/webhook/ — Handle Stripe webhook events."""
    permission_classes = (AllowAny,)

    def post(self, request):
        if not settings.STRIPE_WEBHOOK_SECRET:
            return HttpResponse(status=400)

        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
        except (ValueError, stripe.error.SignatureVerificationError):
            return HttpResponse(status=400)

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            email = session.get("customer_email")
            if email:
                try:
                    sub = Subscription.objects.get(user__email=email)
                    sub.tier = Subscription.Tier.STARTER  # Default upgrade to starter
                    sub.stripe_customer_id = session.get("customer", "")
                    sub.stripe_subscription_id = session.get("subscription", "")
                    sub.active = True
                    sub.save()
                    logger.info(f"Upgraded {email} to starter")
                except Subscription.DoesNotExist:
                    logger.warning(f"Webhook: no subscription for {email}")

        elif event["type"] == "customer.subscription.deleted":
            sub_id = event["data"]["object"].get("id")
            try:
                sub = Subscription.objects.get(stripe_subscription_id=sub_id)
                sub.tier = Subscription.Tier.FREE
                sub.active = True
                sub.save()
                logger.info(f"Downgraded {sub.user.email} to free")
            except Subscription.DoesNotExist:
                pass

        return HttpResponse(status=200)
