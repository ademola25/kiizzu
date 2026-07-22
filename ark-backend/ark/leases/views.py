from rest_framework import generics, status
from rest_framework.response import Response

from .models import Lease
from .serializers import LeaseCreateSerializer, LeaseDetailSerializer, LeaseUpdateSerializer
from .services import create_lease_with_schedule, update_lease_recalculate


class LeaseCreateView(generics.CreateAPIView):
    """POST /api/v1/leases/ — Create lease + generate payment schedule."""
    serializer_class = LeaseCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lease = create_lease_with_schedule(request.user, serializer.validated_data)
        return Response(
            LeaseDetailSerializer(lease).data,
            status=status.HTTP_201_CREATED,
        )


class LeaseDetailView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/v1/leases/{id}/ — View or update lease."""

    def get_queryset(self):
        return Lease.objects.filter(user=self.request.user).prefetch_related("payment_schedules")

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return LeaseUpdateSerializer
        return LeaseDetailSerializer

    def perform_update(self, serializer):
        lease = self.get_object()
        update_lease_recalculate(lease, serializer.validated_data)

    def update(self, request, *args, **kwargs):
        self.perform_update(self.get_serializer(data=request.data))
        lease = self.get_object()
        return Response(LeaseDetailSerializer(lease).data)


class LeaseListView(generics.ListAPIView):
    """GET /api/v1/leases/ — List user's leases."""
    serializer_class = LeaseDetailSerializer

    def get_queryset(self):
        return Lease.objects.filter(user=self.request.user).prefetch_related("payment_schedules")
