from datetime import date
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from ark.payments.models import PaymentSchedule
from schedule_engine.calculator import calculate_schedule

from .models import Lease


@transaction.atomic
def create_lease_with_schedule(user, data: dict) -> Lease:
    """Create lease and generate all payment schedule rows."""
    lease = Lease.objects.create(user=user, **data)
    _generate_schedule(lease)
    user.onboarding_complete = True
    user.save(update_fields=["onboarding_complete"])
    return lease


@transaction.atomic
def update_lease_recalculate(lease: Lease, data: dict) -> Lease:
    """Update lease and recalculate future payments, preserving past history."""
    for key, value in data.items():
        setattr(lease, key, value)
    lease.save()

    today = timezone.now().date()

    # Delete only future pending payments — preserve completed/ready history
    PaymentSchedule.objects.filter(
        lease=lease,
        due_date__gt=today,
        status=PaymentSchedule.Status.PENDING,
    ).delete()

    # Regenerate future payments from today
    _generate_schedule(lease, after_date=today)
    return lease


def _generate_schedule(lease: Lease, after_date: date | None = None):
    """Generate PaymentSchedule rows from the schedule engine."""
    cheques = calculate_schedule(
        start_date=lease.start_date,
        pattern=lease.cheque_pattern,
        annual_amount=Decimal(str(lease.rent_amount)),
    )

    today = timezone.now().date()
    schedules = []
    for cheque in cheques:
        if after_date and cheque.due_date <= after_date:
            continue
        schedules.append(
            PaymentSchedule(
                lease=lease,
                cheque_number=cheque.cheque_number,
                due_date=cheque.due_date,
                amount=cheque.amount,
                status=(
                    PaymentSchedule.Status.COMPLETED
                    if cheque.due_date < today
                    else PaymentSchedule.Status.PENDING
                ),
            )
        )
    PaymentSchedule.objects.bulk_create(schedules)
