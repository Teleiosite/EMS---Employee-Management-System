from django.contrib.auth import get_user_model

User = get_user_model()


def run():
    User.objects.get_or_create(email='admin@example.com', defaults={'role': 'ADMIN', 'is_staff': True, 'is_superuser': True})
