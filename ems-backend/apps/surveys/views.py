from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Avg
from .models import PulseSurvey, SurveyResponse
from .serializers import PulseSurveySerializer, SurveyResponseSerializer
from apps.core.tenancy import resolve_tenant
from apps.core.permissions import IsAdminOrHRManager, HasEnterpriseTier
from apps.core.utils import increment_feature_usage

class PulseSurveyViewSet(viewsets.ModelViewSet):
    queryset = PulseSurvey.objects.all()
    serializer_class = PulseSurveySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter by tenant
        return self.queryset.filter(tenant=resolve_tenant(self.request))

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the currently active survey for the tenant."""
        tenant = resolve_tenant(request)
        survey = PulseSurvey.objects.filter(tenant=tenant, is_active=True).first()
        if not survey:
            return Response({'detail': 'No active survey found.'}, status=404)
        serializer = self.get_serializer(survey)
        return Response(serializer.data)

class SurveyResponseViewSet(viewsets.ModelViewSet):
    queryset = SurveyResponse.objects.all()
    serializer_class = SurveyResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Automatically assign the current employee and tenant
        serializer.save(
            employee=self.request.user.employee_profile,
        )


class SurveyAnalyticsView(APIView):
    """Admin-only view for workforce sentiment analytics."""
    permission_classes = [IsAdminOrHRManager, HasEnterpriseTier]
    feature_key = 'workforce_analytics'

    def get(self, request):
        tenant = resolve_tenant(request)
        if not tenant:
            return Response({'detail': 'Tenant context required.'}, status=400)

        increment_feature_usage(self.request, self.feature_key)

        # Aggregate sentiment counts across all responses in this tenant
        responses = SurveyResponse.objects.filter(survey__tenant=tenant)
        sentiment_counts = responses.values('sentiment').annotate(count=Count('sentiment')).order_by('sentiment')
        
        # Calculate response rate
        total_employees = tenant.current_employee_count
        responded_count = responses.values('employee').distinct().count()
        response_rate = (responded_count / total_employees * 100) if total_employees > 0 else 0

        # Format data for charts
        chart_data = [
            {'name': 'Very Sad', 'count': 0},
            {'name': 'Sad', 'count': 0},
            {'name': 'Neutral', 'count': 0},
            {'name': 'Happy', 'count': 0},
            {'name': 'Very Happy', 'count': 0},
        ]
        
        sentiment_map = {1: 'Very Sad', 2: 'Sad', 3: 'Neutral', 4: 'Happy', 5: 'Very Happy'}
        for entry in sentiment_counts:
            label = sentiment_map.get(entry['sentiment'])
            if label:
                for item in chart_data:
                    if item['name'] == label:
                        item['count'] = entry['count']

        return Response({
            'sentiment_analysis': chart_data,
            'response_rate': response_rate,
            'total_responses': responses.count(),
            'average_sentiment': responses.aggregate(Avg('sentiment'))['sentiment__avg'] or 0
        })
