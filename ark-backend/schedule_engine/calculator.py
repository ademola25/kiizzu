"""
Cheque schedule calculator. Zero Django imports.

Given a lease start date, cheque pattern, and annual rent amount,
calculates all cheque payment dates and amounts for one year.
"""
import calendar
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from .types import ChequeDate, ChequePattern


def calculate_schedule(
    start_date: date,
    pattern: int,
    annual_amount: Decimal,
) -> list[ChequeDate]:
    """
    Calculate cheque payment schedule.

    Args:
        start_date: Lease start date (first cheque date)
        pattern: Number of cheques per year (1, 2, 3, 4, or 6)
        annual_amount: Total annual rent in AED

    Returns:
        List of ChequeDate objects, one per cheque
    """
    if pattern not in (p.value for p in ChequePattern):
        raise ValueError(f"Invalid cheque pattern: {pattern}. Must be 1, 2, 3, 4, or 6.")

    if annual_amount <= 0:
        raise ValueError("Annual amount must be positive.")

    months_between = 12 // pattern
    cheque_amount = (Decimal(str(annual_amount)) / pattern).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    schedule = []
    for i in range(pattern):
        due_date = _add_months(start_date, i * months_between)
        schedule.append(
            ChequeDate(
                cheque_number=i + 1,
                due_date=due_date,
                amount=cheque_amount,
            )
        )

    return schedule


def _add_months(start: date, months: int) -> date:
    """Add months to a date, clamping to last day of month if needed."""
    month = start.month + months
    year = start.year + (month - 1) // 12
    month = (month - 1) % 12 + 1
    max_day = calendar.monthrange(year, month)[1]
    day = min(start.day, max_day)
    return date(year, month, day)
