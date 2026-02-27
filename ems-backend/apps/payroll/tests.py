from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.payroll.models import PayrollRun, Payslip
from apps.employees.models import Department, Designation, EmployeeProfile

User = get_user_model()

class PayloadTests(APITestCase):
    def setUp(self):
        # Create users
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='password123',
            role='ADMIN'
        )
        self.employee_user = User.objects.create_user(
            email='emp@example.com',
            pass='password123',
            role='EMPLOYEE'
        )
        
        # Setup Employee Profile
        self.department = Department.objects.create(name='IT', description='Development')
        self.designation = Designation.objects.create(title='Developer', department=self.department)
        
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee_user,
            department=self.department,
            designation=self.designation,
            employee_id='EMP-001',
            base_salary=50000,
            joining_date='2020-01-01'
        )
        
        # Create Payroll Run and Payslip
        self.run = PayrollRun.objects.create(month='2023-01-01', status='COMPLETED')
        self.payslip = Payslip.objects.create(
            payroll_run=self.run,
            employee=self.employee_profile,
            gross_salary=4000,
            total_deductions=500,
            net_salary=3500
        )
        self.payslip_url = reverse('payslip-list')

    def test_payslip_list_employee(self):
        """Employee only sees their own payslips"""
        self.client.force_authenticate(user=self.employee_user)
        response = self.client.get(self.payslip_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should contain ONLY own payslips
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['employee_name'], self.employee_user.first_name + ' ' + self.employee_user.last_name)
    
    def test_payslip_admin_view_all(self):
        """Admin can see all payslips"""
        # Create another payslip for another employee
        other_user = User.objects.create_user(email='other@test.com', role='EMPLOYEE')
        other_profile = EmployeeProfile.objects.create(user=other_user, department=self.department, designation=self.designation, employee_id='EMP-002', base_salary=20000)
        Payslip.objects.create(
            payroll_run=self.run, employee=other_profile,
            gross_salary=2000, total_deductions=500, net_salary=1500
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.payslip_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_payslip_fields_serialized(self):
        """Checks if enhanced serializer fields (name, designation, month, status) are present"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f"{self.payslip_url}{self.payslip.id}/")
        data = response.data
        self.assertIn('employee_name', data)
        self.assertIn('employee_designation', data)
        self.assertIn('payroll_month', data)
        self.assertIn('payroll_status', data)
