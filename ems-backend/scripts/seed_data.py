from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model

from apps.attendance.models import AttendanceLog
from apps.employees.models import Department, Designation, EmployeeProfile
from apps.leaves.models import LeaveBalance, LeavePolicyWindow, LeaveRequest, LeaveType
from apps.payroll.models import PayrollRun, Payslip, SalaryComponent, SalaryStructure, SalaryStructureComponent, TaxSlab

User = get_user_model()


def run():
    admin, _ = User.objects.get_or_create(
        email='admin@example.com',
        defaults={
            'role': 'ADMIN',
            'is_staff': True,
            'is_superuser': True,
            'is_active': True,
            'email_verified': True,
            'first_name': 'System',
            'last_name': 'Admin',
        },
    )
    admin.set_password('Admin@12345')
    admin.save(update_fields=['password'])

    hr, _ = User.objects.get_or_create(
        email='hr@example.com',
        defaults={'role': 'HR_MANAGER', 'is_active': True, 'email_verified': True, 'first_name': 'Helen', 'last_name': 'HR'},
    )
    hr.set_password('Hr@123456')
    hr.save(update_fields=['password'])

    eng, _ = Department.objects.get_or_create(name='Engineering', defaults={'manager': hr})
    designation, _ = Designation.objects.get_or_create(title='Software Engineer')

    employee_user, _ = User.objects.get_or_create(
        email='employee@example.com',
        defaults={'role': 'EMPLOYEE', 'is_active': True, 'email_verified': True, 'first_name': 'Ema', 'last_name': 'Stone'},
    )
    employee_user.set_password('Employee@123')
    employee_user.save(update_fields=['password'])

    employee, _ = EmployeeProfile.objects.get_or_create(
        user=employee_user,
        defaults={
            'department': eng,
            'designation': designation,
            'employee_id': 'EMP001',
            'base_salary': Decimal('90000.00'),
            'joining_date': date.today() - timedelta(days=365),
        },
    )

    leave_type, _ = LeaveType.objects.get_or_create(name='Annual Leave', defaults={'max_days_per_year': 24})
    LeavePolicyWindow.objects.get_or_create(
        leave_type=leave_type,
        start_date=date(date.today().year, 1, 1),
        end_date=date(date.today().year, 12, 31),
        defaults={'carry_forward_limit': Decimal('5.0')},
    )
    LeaveBalance.objects.get_or_create(
        employee=employee,
        leave_type=leave_type,
        year=date.today().year,
        defaults={'available_days': Decimal('18.0'), 'used_days': Decimal('6.0')},
    )

    LeaveRequest.objects.get_or_create(
        employee=employee,
        leave_type=leave_type,
        start_date=date.today() + timedelta(days=10),
        end_date=date.today() + timedelta(days=12),
        defaults={'duration_days': Decimal('3.0'), 'reason': 'Family trip', 'status': 'PENDING'},
    )

    AttendanceLog.objects.get_or_create(
        employee=employee,
        date=date.today(),
        defaults={'status': 'PRESENT'},
    )

    basic, _ = SalaryComponent.objects.get_or_create(name='HRA', defaults={'component_type': 'EARNING', 'calculation_type': 'PERCENTAGE'})
    prof_tax, _ = SalaryComponent.objects.get_or_create(name='Professional Tax', defaults={'component_type': 'DEDUCTION', 'calculation_type': 'FIXED'})

    structure, _ = SalaryStructure.objects.get_or_create(employee=employee, defaults={'effective_date': date.today() - timedelta(days=90)})
    SalaryStructureComponent.objects.get_or_create(salary_structure=structure, component=basic, defaults={'value': Decimal('20.00')})
    SalaryStructureComponent.objects.get_or_create(salary_structure=structure, component=prof_tax, defaults={'value': Decimal('200.00')})

    TaxSlab.objects.get_or_create(min_income=Decimal('0.00'), max_income=Decimal('50000.00'), defaults={'rate_percent': Decimal('0.00')})
    TaxSlab.objects.get_or_create(min_income=Decimal('50000.00'), max_income=Decimal('100000.00'), defaults={'rate_percent': Decimal('10.00')})
    TaxSlab.objects.get_or_create(min_income=Decimal('100000.00'), max_income=None, defaults={'rate_percent': Decimal('20.00')})

    run_obj, _ = PayrollRun.objects.get_or_create(month=date(date.today().year, date.today().month, 1), defaults={'status': 'COMPLETED'})
    Payslip.objects.get_or_create(
        payroll_run=run_obj,
        employee=employee,
        defaults={
            'gross_salary': Decimal('108000.00'),
            'total_deductions': Decimal('8600.00'),
            'tax_deduction': Decimal('8400.00'),
            'net_salary': Decimal('99400.00'),
        },
    )
