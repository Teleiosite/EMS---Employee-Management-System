from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.core.models import Announcement

User = get_user_model()

class AnnouncementTests(APITestCase):
    def setUp(self):
        # Create users with different roles
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='password123',
            role='ADMIN'
        )
        self.hr = User.objects.create_user(
            email='hr@example.com',
            password='password123',
            role='HR_MANAGER'
        )
        self.employee = User.objects.create_user(
            email='emp@example.com',
            password='password123',
            role='EMPLOYEE'
        )
        self.announcement_url = reverse('announcement-list')

    def test_create_announcement_admin(self):
        """Admin can create announcements"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'title': 'Test Announcement',
            'content': 'This is a test.',
            'date': '2023-01-01',
            'priority': 'HIGH'
        }
        response = self.client.post(self.announcement_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Announcement.objects.count(), 1)
        self.assertEqual(Announcement.objects.get().created_by, self.admin)

    def test_create_announcement_employee_forbidden(self):
        """Regular employees cannot create announcements"""
        self.client.force_authenticate(user=self.employee)
        data = {'title': 'Fail', 'content': 'Fail', 'date': '2023-01-01', 'priority': 'LOW'}
        response = self.client.post(self.announcement_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_list_announcements_authenticated(self):
        """Authenticated users can list announcements"""
        Announcement.objects.create(
            title='Public Info', 
            content='Info', 
            date='2023-01-01', 
            priority='NORMAL',
            created_by=self.admin
        )
        self.client.force_authenticate(user=self.employee)
        response = self.client.get(self.announcement_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
