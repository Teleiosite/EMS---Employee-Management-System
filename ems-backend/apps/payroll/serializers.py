from rest_framework import serializers
from .models import PayrollRun


class PayrollRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollRun
        fields = '__all__'
