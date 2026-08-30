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
        # A past-due cheque used to be flipped to COMPLETED here, on every read.
        # That silently told the tenant an unfunded cheque had been paid, made
        # the "Overdue" state unreachable, and quietly re-completed anything the
        # user had just un-marked. Whether a cheque cleared is something only the
        # tenant knows, so it stays PENDING and surfaces as `display_status`
        # "overdue" until they say otherwise. (Back-filling cheques that predate
        # setup still happens once, at lease creation, in leases/services.py.)
        # select_related because the serializer now reads lease.currency —
        # without it this is one extra query per cheque in the list.
        return qs.select_related("lease")


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


class PaymentMarkPaidView(APIView):
    """POST /api/v1/payment-schedules/{id}/mark-paid/ — Record a cheque as paid
    (cleared) manually, from either 'pending' or 'ready'."""

    def post(self, request, pk):
        try:
            payment = PaymentSchedule.objects.get(pk=pk, lease__user=request.user)
        except PaymentSchedule.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if payment.status == PaymentSchedule.Status.COMPLETED:
            return Response(
                {"detail": "This cheque is already marked as paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.status = PaymentSchedule.Status.COMPLETED
        payment.save(update_fields=["status", "updated_at"])
        return Response(PaymentScheduleSerializer(payment).data)


class PaymentMarkUnpaidView(APIView):
    """POST /api/v1/payment-schedules/{id}/mark-unpaid/ — Undo a mark-as-paid.

    Marking a cheque paid is one tap on the dashboard and easy to hit by
    accident, so it has to be reversible. Returns to PENDING rather than to
    whatever it was before: the previous state is not recorded, and PENDING is
    the safe end of the pair — it says "still owed", which is the thing the user
    is trying to get back to. Reminder flags are deliberately left alone so an
    undo cannot cause a reminder the tenant already received to be sent twice.
    """

    def post(self, request, pk):
        try:
            payment = PaymentSchedule.objects.get(pk=pk, lease__user=request.user)
        except PaymentSchedule.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if payment.status != PaymentSchedule.Status.COMPLETED:
            return Response(
                {"detail": "This cheque is not marked as paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.status = PaymentSchedule.Status.PENDING
        payment.save(update_fields=["status", "updated_at"])
        return Response(PaymentScheduleSerializer(payment).data)
