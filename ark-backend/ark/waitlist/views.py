from rest_framework import generics, permissions

from .models import WaitlistSignup
from .serializers import WaitlistSignupSerializer


class WaitlistSignupView(generics.CreateAPIView):
    queryset = WaitlistSignup.objects.all()
    serializer_class = WaitlistSignupSerializer
    permission_classes = (permissions.AllowAny,)

    def perform_create(self, serializer):
        serializer.save(
            source=self.request.query_params.get("source", "")[:120],
            user_agent=self.request.META.get("HTTP_USER_AGENT", "")[:500],
        )
