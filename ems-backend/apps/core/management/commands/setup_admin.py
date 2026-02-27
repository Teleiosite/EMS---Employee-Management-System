from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Creates or updates the default admin user with correct permissions and role'

    def handle(self, *args, **options):
        User = get_user_model()
        email = 'admin@ems.com'
        
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': 'System',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
                'role': 'ADMIN',
                'email_verified': True
            }
        )
        
        if created:
            user.set_password('admin123')
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully created admin user {email}'))
        else:
            # Update existing user to ensure they have the right permissions
            user.is_staff = True
            user.is_superuser = True
            user.role = 'ADMIN'
            user.is_active = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully updated admin user {email} with ADMIN role'))
