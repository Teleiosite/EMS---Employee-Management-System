from apps.core.tenancy import resolve_tenant
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Department, Designation, EmployeeProfile
# Forward reference to avoid circular import if needed, but here we just import
from apps.payroll.serializers import SalaryStructureSerializer


User = get_user_model()


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'
        read_only_fields = ('tenant',)


class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = '__all__'
        read_only_fields = ('tenant',)


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
    salary_structure = SalaryStructureSerializer(read_only=True)
    reports_to = serializers.SerializerMethodField()

    def get_reports_to(self, obj):
        if obj.reports_to:
            return {
                'id': obj.reports_to.id,
                'name': obj.reports_to.full_name,
                'designation': obj.reports_to.designation.title if obj.reports_to.designation else 'Not Set'
            }
        return None

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
    reports_to_id = serializers.PrimaryKeyRelatedField(
        queryset=EmployeeProfile.objects.all(), source='reports_to', write_only=True,
        required=False, allow_null=True
    )

    class Meta:
        model = EmployeeProfile
        fields = '__all__'
        read_only_fields = ('tenant',)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if not request:
            return
        tenant = resolve_tenant(request)
        self.fields['user_id'].queryset = User.objects.filter(tenant=tenant)
        self.fields['department_id'].queryset = Department.objects.filter(tenant=tenant)
        self.fields['designation_id'].queryset = Designation.objects.filter(tenant=tenant)
        self.fields['reports_to_id'].queryset = EmployeeProfile.objects.filter(tenant=tenant)
