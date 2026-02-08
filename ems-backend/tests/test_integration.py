from datetime import date
from decimal import Decimal
from types import SimpleNamespace

from apps.leaves.utils import business_days
from apps.payroll.utils import calculate_payroll
from apps.recruitment.resume_parser import extract_email


def test_business_days_counts_weekdays_only():
    assert business_days(date(2026, 1, 1), date(2026, 1, 7)) == 5


def test_calculate_payroll_returns_net_values():
    rows = [
        SimpleNamespace(component=SimpleNamespace(component_type='EARNING'), value=Decimal('1000.00')),
        SimpleNamespace(component=SimpleNamespace(component_type='EARNING'), value=Decimal('500.00')),
        SimpleNamespace(component=SimpleNamespace(component_type='DEDUCTION'), value=Decimal('200.00')),
    ]
    totals = calculate_payroll(rows)
    assert totals == {
        'gross': Decimal('1500.00'),
        'deductions': Decimal('200.00'),
        'net': Decimal('1300.00'),
    }


def test_extract_email_returns_first_match():
    assert extract_email('Contact: jane.doe@example.com, alt: x@y.z') == 'jane.doe@example.com'
