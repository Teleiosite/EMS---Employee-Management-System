from rest_framework import serializers
from .models import Subscription, Transaction

class SubscriptionSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    
    class Meta:
        model = Subscription
        fields = ['id', 'tier', 'tier_display', 'is_active', 'start_date', 'end_date']

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'currency', 'reference', 'status', 'payment_method', 'created_at']
