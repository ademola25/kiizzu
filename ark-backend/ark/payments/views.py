from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PaymentSchedule
from .serializers import PaymentScheduleSerializer, PaymentStatusUpdateSerializer


class PaymentScheduleListView(generics.ListAPIView):
    """GET /api/v1/payment-schedules/ — List user's payment schedule."""
    serializer_class = PaymentScheduleSerializer

    def get_queryset(self):
        qs = PaymentSchedule.objects.filter(lease__user=self.request.user)
        # Auto-complete past-due pending cheques
        today = timezone.now().date()
        qs.filter(due_date__lt=today, status=PaymentSchedule.Status.PENDING).update(
            status=PaymentSchedule.Status.COMPLETED
        )
        return qs


class PaymentMarkReadyView(APIView):
    """POST /api/v1/payment-schedules/{id}/mark-ready/ — Mark cheque as funds ready."""

    def post(self, request, pk):
        try:
            payment = PaymentSchedule.objects.get(pk=pk, lease__user=request.user)
        except PaymentSchedule.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if payment.status != PaymentSchedule.Status.PENDING:
            return Response(
                {"detail": f"Cannot mark as ready — current status is '{payment.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.status = PaymentSchedule.Status.READY
        payment.save(update_fields=["status", "updated_at"])
        return Response(PaymentScheduleSerializer(payment).data)
