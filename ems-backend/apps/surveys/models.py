from django.db import models
from apps.core.models import Tenant, TimeStampedModel
from apps.employees.models import EmployeeProfile

class PulseSurvey(TimeStampedModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='pulse_surveys')
    question = models.CharField(max_length=255, default="How are you feeling today?")
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(EmployeeProfile, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.tenant.name} - {self.question}"

class SurveyResponse(TimeStampedModel):
    SENTIMENT_CHOICES = [
        (1, 'Very Sad'),
        (2, 'Sad'),
        (3, 'Neutral'),
        (4, 'Happy'),
        (5, 'Very Happy'),
    ]

    survey = models.ForeignKey(PulseSurvey, on_delete=models.CASCADE, related_name='responses')
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name='survey_responses')
    sentiment = models.IntegerField(choices=SENTIMENT_CHOICES)
    anonymous_comment = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('survey', 'employee')  # One response per employee per survey

    def __str__(self):
        return f"{self.employee.full_name} - {self.sentiment}"
