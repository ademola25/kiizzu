"""Feature gate middleware — checks subscription tier before gated endpoints."""
from rest_framework.response import Response
from rest_framework import status


TIER_GATES = {
    # endpoint prefix → minimum tier required
    # WhatsApp preference changes are gated to starter+
}


def check_feature_gate(user, feature: str) -> bool:
    """Check if user's subscription tier allows a feature."""
    try:
        sub = user.subscription
    except Exception:
        return False

    tier_rank = {"free": 0, "starter": 1, "pro": 2}
    required_rank = {"whatsapp": 1, "multi_property": 2, "analytics": 2}

    user_rank = tier_rank.get(sub.tier, 0)
    required = required_rank.get(feature, 0)

    return user_rank >= required
