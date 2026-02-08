from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient



@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def setup_users(db):
    from apps.employees.models import Department, Designation, EmployeeProfile
    from apps.leaves.models import LeaveBalance, LeavePolicyWindow, LeaveType

    User = get_user_model()
    admin = User.objects.create_user(email='admin@ems.com', password='Admin@12345', role='ADMIN', is_active=True)
    hr = User.objects.create_user(email='hr@ems.com', password='Hr@123456', role='HR_MANAGER', is_active=True)
    employee_user = User.objects.create_user(email='emp@ems.com', password='Employee@123', role='EMPLOYEE', is_active=True)
    other_employee_user = User.objects.create_user(email='emp2@ems.com', password='Employee@123', role='EMPLOYEE', is_active=True)

    dept = Department.objects.create(name='Engineering')
    desig = Designation.objects.create(title='Developer')
    employee = EmployeeProfile.objects.create(
        user=employee_user,
        department=dept,
        designation=desig,
        employee_id='E100',
        base_salary=Decimal('50000.00'),
        joining_date=date.today() - timedelta(days=120),
    )
    other = EmployeeProfile.objects.create(
        user=other_employee_user,
        department=dept,
        designation=desig,
        employee_id='E101',
        base_salary=Decimal('50000.00'),
        joining_date=date.today() - timedelta(days=120),
    )

    leave_type = LeaveType.objects.create(name='Annual', max_days_per_year=24)
    LeavePolicyWindow.objects.create(
        leave_type=leave_type,
        start_date=date(date.today().year, 1, 1),
        end_date=date(date.today().year, 12, 31),
        carry_forward_limit=Decimal('5.0'),
    )
    LeaveBalance.objects.create(employee=employee, leave_type=leave_type, year=date.today().year, available_days=Decimal('10.0'))
    LeaveBalance.objects.create(employee=other, leave_type=leave_type, year=date.today().year, available_days=Decimal('10.0'))

    return {'admin': admin, 'hr': hr, 'employee': employee_user, 'other': other_employee_user, 'employee_profile': employee, 'leave_type': leave_type}


@pytest.mark.django_db
def test_login_lockout_after_failed_attempts(api_client, setup_users):
    email = setup_users['employee'].email
    for _ in range(5):
        response = api_client.post('/api/auth/login/', {'email': email, 'password': 'wrongpass'}, format='json')
        assert response.status_code == 400

    locked = api_client.post('/api/auth/login/', {'email': email, 'password': 'Employee@123'}, format='json')
    assert locked.status_code == 400
    assert 'locked' in str(locked.data).lower()


@pytest.mark.django_db
def test_employee_can_create_own_leave_request(api_client, setup_users):
    api_client.force_authenticate(user=setup_users['employee'])
    payload = {
        'employee': setup_users['employee_profile'].id,
        'leave_type': setup_users['leave_type'].id,
        'start_date': str(date.today() + timedelta(days=2)),
        'end_date': str(date.today() + timedelta(days=3)),
        'duration_days': '2.0',
        'reason': 'Personal',
        'status': 'PENDING',
    }
    response = api_client.post('/api/leaves/requests/', payload, format='json')
    assert response.status_code == 201


@pytest.mark.django_db
def test_employee_cannot_approve_leave_request(api_client, setup_users):
    api_client.force_authenticate(user=setup_users['employee'])
    create_payload = {
        'employee': setup_users['employee_profile'].id,
        'leave_type': setup_users['leave_type'].id,
        'start_date': str(date.today() + timedelta(days=2)),
        'end_date': str(date.today() + timedelta(days=2)),
        'duration_days': '1.0',
        'reason': 'Appointment',
        'status': 'PENDING',
    }
    created = api_client.post('/api/leaves/requests/', create_payload, format='json')
    request_id = created.data['id']

    patch = api_client.patch(f'/api/leaves/requests/{request_id}/', {'status': 'APPROVED'}, format='json')
    assert patch.status_code == 403


@pytest.mark.django_db
def test_admin_can_manage_tax_slabs(api_client, setup_users):
    api_client.force_authenticate(user=setup_users['admin'])
    response = api_client.post(
        '/api/payroll/tax-slabs/',
        {'min_income': '0.00', 'max_income': '50000.00', 'rate_percent': '5.00'},
        format='json',
    )
    assert response.status_code == 201
