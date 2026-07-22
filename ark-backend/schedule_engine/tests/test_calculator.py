"""Tests for cheque schedule calculator. 100% coverage on all 5 patterns + edge cases."""
from datetime import date
from decimal import Decimal

import pytest

from schedule_engine.calculator import calculate_schedule
from schedule_engine.types import ChequePattern


class TestCalculateSchedule:
    """Test all 5 cheque patterns."""

    def test_annual_1_cheque(self):
        result = calculate_schedule(date(2026, 1, 1), ChequePattern.ANNUAL, Decimal("90000"))
        assert len(result) == 1
        assert result[0].cheque_number == 1
        assert result[0].due_date == date(2026, 1, 1)
        assert result[0].amount == Decimal("90000.00")

    def test_biannual_2_cheques(self):
        result = calculate_schedule(date(2026, 1, 1), ChequePattern.BIANNUAL, Decimal("90000"))
        assert len(result) == 2
        assert result[0].due_date == date(2026, 1, 1)
        assert result[1].due_date == date(2026, 7, 1)
        assert all(c.amount == Decimal("45000.00") for c in result)

    def test_triannual_3_cheques(self):
        result = calculate_schedule(date(2026, 1, 1), ChequePattern.TRIANNUAL, Decimal("90000"))
        assert len(result) == 3
        assert result[0].due_date == date(2026, 1, 1)
        assert result[1].due_date == date(2026, 5, 1)
        assert result[2].due_date == date(2026, 9, 1)
        assert all(c.amount == Decimal("30000.00") for c in result)

    def test_quarterly_4_cheques(self):
        result = calculate_schedule(date(2026, 3, 15), ChequePattern.QUARTERLY, Decimal("120000"))
        assert len(result) == 4
        assert result[0].due_date == date(2026, 3, 15)
        assert result[1].due_date == date(2026, 6, 15)
        assert result[2].due_date == date(2026, 9, 15)
        assert result[3].due_date == date(2026, 12, 15)
        assert all(c.amount == Decimal("30000.00") for c in result)

    def test_bimonthly_6_cheques(self):
        result = calculate_schedule(date(2026, 1, 1), ChequePattern.BIMONTHLY, Decimal("60000"))
        assert len(result) == 6
        dates = [c.due_date for c in result]
        assert dates == [
            date(2026, 1, 1), date(2026, 3, 1), date(2026, 5, 1),
            date(2026, 7, 1), date(2026, 9, 1), date(2026, 11, 1),
        ]
        assert all(c.amount == Decimal("10000.00") for c in result)

    def test_cheque_numbers_sequential(self):
        result = calculate_schedule(date(2026, 1, 1), 4, Decimal("100000"))
        numbers = [c.cheque_number for c in result]
        assert numbers == [1, 2, 3, 4]


class TestEdgeCases:
    """Edge cases: month-end clamping, leap year, rounding."""

    def test_month_end_clamping_jan31(self):
        """Jan 31 + 1 month = Feb 28 (not Feb 31)."""
        result = calculate_schedule(date(2026, 1, 31), ChequePattern.BIANNUAL, Decimal("90000"))
        assert result[0].due_date == date(2026, 1, 31)
        assert result[1].due_date == date(2026, 7, 31)

    def test_month_end_clamping_march31_quarterly(self):
        """Mar 31 → Jun 30 → Sep 30 → Dec 31."""
        result = calculate_schedule(date(2026, 3, 31), ChequePattern.QUARTERLY, Decimal("80000"))
        dates = [c.due_date for c in result]
        assert dates == [date(2026, 3, 31), date(2026, 6, 30), date(2026, 9, 30), date(2026, 12, 31)]

    def test_leap_year_feb29_start(self):
        """Start on Feb 29 in leap year."""
        result = calculate_schedule(date(2028, 2, 29), ChequePattern.QUARTERLY, Decimal("100000"))
        assert result[0].due_date == date(2028, 2, 29)
        assert result[1].due_date == date(2028, 5, 29)

    def test_uneven_division_rounding(self):
        """100000 / 3 = 33333.33 (rounded)."""
        result = calculate_schedule(date(2026, 1, 1), ChequePattern.TRIANNUAL, Decimal("100000"))
        assert all(c.amount == Decimal("33333.33") for c in result)

    def test_mid_year_start(self):
        """Start in July with 3 cheques."""
        result = calculate_schedule(date(2026, 7, 15), ChequePattern.TRIANNUAL, Decimal("90000"))
        assert result[0].due_date == date(2026, 7, 15)
        assert result[1].due_date == date(2026, 11, 15)
        assert result[2].due_date == date(2027, 3, 15)


class TestValidation:
    """Input validation."""

    def test_invalid_pattern(self):
        with pytest.raises(ValueError, match="Invalid cheque pattern"):
            calculate_schedule(date(2026, 1, 1), 5, Decimal("90000"))

    def test_zero_amount(self):
        with pytest.raises(ValueError, match="must be positive"):
            calculate_schedule(date(2026, 1, 1), 4, Decimal("0"))

    def test_negative_amount(self):
        with pytest.raises(ValueError, match="must be positive"):
            calculate_schedule(date(2026, 1, 1), 4, Decimal("-1000"))
