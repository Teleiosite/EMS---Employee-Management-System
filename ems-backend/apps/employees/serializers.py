from django.contrib.auth import get_user_model
from rest_framework import serializers
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


class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role')
        read_only_fields = fields


class EmployeeProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    user = NestedUserSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    designation = DesignationSerializer(read_only=True)

    # Accept write IDs for create/update
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True, required=False
    )
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), source='department', write_only=True,
        required=False, allow_null=True
    )
    designation_id = serializers.PrimaryKeyRelatedField(
        queryset=Designation.objects.all(), source='designation', write_only=True,
        required=False, allow_null=True
    )

    class Meta:
        model = EmployeeProfile
        fields = '__all__'
