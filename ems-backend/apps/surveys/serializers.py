from rest_framework import serializers
from .models import PulseSurvey, SurveyResponse

class PulseSurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = PulseSurvey
        fields = ['id', 'question', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class SurveyResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyResponse
        fields = ['id', 'survey', 'sentiment', 'anonymous_comment', 'created_at']
        read_only_fields = ['id', 'created_at']
