from rest_framework import serializers

from .models import (
    PayrollRun, Payslip, TaxSlab, SalaryComponent, SalaryStructure, 
    SalaryStructureComponent, PayslipComponent
)



class PayrollRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollRun
        fields = '__all__'
        read_only_fields = ('tenant',)


class SalaryComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryComponent
        fields = '__all__'
        read_only_fields = ('tenant',)


class TaxSlabSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxSlab
        fields = '__all__'
        read_only_fields = ('tenant',)



class SalaryStructureComponentSerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='name', required=False, allow_null=True)
    component_type = serializers.CharField(required=False, allow_null=True)

    class Meta:
        model = SalaryStructureComponent
        fields = ('id', 'component', 'component_name', 'component_type', 'value', 'name')

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # If component is linked, use its name/type if custom ones are not set
        if instance.component:
            if not ret.get('component_name'):
                ret['component_name'] = instance.component.name
            if not ret.get('component_type'):
                ret['component_type'] = instance.component.component_type
        return ret


class SalaryStructureSerializer(serializers.ModelSerializer):
    components = SalaryStructureComponentSerializer(many=True, required=False)

    class Meta:
        model = SalaryStructure
        fields = ('id', 'employee', 'effective_date', 'components')

    def create(self, validated_data):
        components_data = validated_data.pop('components', [])
        salary_structure = SalaryStructure.objects.create(**validated_data)
        for comp_data in components_data:
            SalaryStructureComponent.objects.create(salary_structure=salary_structure, **comp_data)
        return salary_structure

    def update(self, instance, validated_data):
        components_data = validated_data.pop('components', None)
        instance.effective_date = validated_data.get('effective_date', instance.effective_date)
        instance.save()

        if components_data is not None:
            # Simple approach: clear and recreate components
            instance.components.all().delete()
            for comp_data in components_data:
                SalaryStructureComponent.objects.create(salary_structure=instance, **comp_data)
        
        return instance



class PayslipComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayslipComponent
        fields = ['id', 'name', 'component_type', 'value']


class PayslipSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.user.get_full_name')
    employee_id_str = serializers.ReadOnlyField(source='employee.employee_id')
    designation = serializers.ReadOnlyField(source='employee.designation.title')
    breakdown = PayslipComponentSerializer(many=True, read_only=True)
    payroll_month = serializers.SerializerMethodField()
    payroll_status = serializers.SerializerMethodField()

    class Meta:
        model = Payslip
        fields = [
            'id', 'payroll_run', 'employee', 'employee_name', 'employee_id_str',
            'designation', 'gross_salary', 'total_deductions', 'tax_deduction',
            'net_salary', 'breakdown', 'payroll_month', 'payroll_status'
        ]

    def get_payroll_month(self, obj):
        if obj.payroll_run and obj.payroll_run.month:
            return obj.payroll_run.month.isoformat()
        return None

    def get_payroll_status(self, obj):
        if obj.payroll_run:
            return obj.payroll_run.status
        return None

