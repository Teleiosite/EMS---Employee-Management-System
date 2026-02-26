from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.authentication.serializers import UserSerializer
from .models import Department, Designation, EmployeeProfile

User = get_user_model()


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = '__all__'


class EmployeeProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source='user', queryset=User.objects.all(), write_only=True)

    class Meta:
        model = EmployeeProfile
        fields = '__all__'
