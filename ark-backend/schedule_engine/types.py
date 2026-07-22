"""Types for the cheque schedule engine. Zero Django imports."""
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from enum import IntEnum


class ChequePattern(IntEnum):
    ANNUAL = 1
    BIANNUAL = 2
    TRIANNUAL = 3
    QUARTERLY = 4
    BIMONTHLY = 6


@dataclass
class ChequeDate:
    cheque_number: int
    due_date: date
    amount: Decimal
