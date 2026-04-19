import hmac
import hashlib
import json
from rest_framework import permissions
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Transaction, Subscription, SubscriptionTier
from .serializers import TransactionSerializer, SubscriptionSerializer
from apps.core.models import Tenant
from apps.core.tenancy import resolve_tenant
import uuid

class PlanInfoView(APIView):
    """
    Returns the available plans, pricing, and features for the Billing UI.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        plans = [
            {
                'id': 'STARTER',
                'name': 'Starter',
                'price': 168000,
                'annual_price': 1680000,
                'limit': 25,
                'features': [
                    'Full Core HR Suite (Employees, Leaves, Attendance)',
                    'Up to 25 Active Employee Profiles',
                    'Basic Recruitment (1 Active Job Posting)',
                    'Self-Service Employee Dashboard',
                    'Cloud Hosting & SSL Included'
                ]
            },
            {
                'id': 'BUSINESS',
                'name': 'Business',
                'price': 350000,
                'annual_price': 3500000,
                'limit': 100,
                'features': [
                    'All Starter features included',
                    'Up to 100 Active Employee Profiles',
                    'Advanced Payroll Management (Auto-Payslips)',
                    'Unlimited Recruitment & AI Parsing',
                    'Workforce Insights & Analytics',
                    'Priority Technical Support'
                ]
            },
            {
                'id': 'ENTERPRISE',
                'name': 'Enterprise',
                'price': 560000,
                'annual_price': 5600000,
                'limit': 999999,
                'features': [
                    'All Business features included',
                    'Unlimited Employees & Multi-Entity Scale',
                    'Full White-Label Rebranding',
                    'Custom Workflow & API Integration',
                    'Engagement Surveys & Sentiment Dashboard',
                    'Dedicated Manager & 24/7 Support'
                ]
            }
        ]
        return Response(plans)

class InitializePaymentView(APIView):
    """
    Generates a unique reference and returns the Paystack public key for the frontend pop-up.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        tenant = resolve_tenant(request)
        plan_id = request.data.get('plan_id')
        amount = request.data.get('amount') # In Naira

        if not plan_id or not amount:
            return Response({'detail': 'plan_id and amount are required.'}, status=400)

        # Generate a unique reference
        reference = f"HW-{tenant.slug[:4].upper()}-{uuid.uuid4().hex[:8].upper()}"

        # Create a pending transaction
        Transaction.objects.create(
            tenant=tenant,
            amount=amount,
            reference=reference,
            status='PENDING',
            payment_method='PAYSTACK'
        )

        return Response({
            'reference': reference,
            'public_key': getattr(settings, 'PAYSTACK_PUBLIC_KEY', ''),
            'email': request.user.email,
            'amount': int(amount) * 100, # Convert to Kobo
        })

class SubscriptionStatusView(APIView):
    """
    Returns the current tenant's subscription tier and usage limits.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant(request)
        return Response({
            'tier': tenant.subscription_tier,
            'limit': tenant.employee_limit,
            'count': tenant.current_employee_count,
        })

class PaystackWebhookview(APIView):
    """
    Webhook handler for Paystack events.
    Handles 'charge.success', 'subscription.create', 'subscription.disable'.
    """
    permission_classes = [] # Public endpoint
    
    @csrf_exempt
    def post(self, request, *args, **kwargs):
        payload = request.body
        signature = request.META.get('HTTP_X_PAYSTACK_SIGNATURE')
        secret = getattr(settings, 'PAYSTACK_SECRET_KEY', '')

        # Verify signature
        if not signature:
            return Response(status=401)
        
        computed_signature = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha512
        ).hexdigest()

        if computed_signature != signature:
            return Response(status=401)

        data = json.loads(payload)
        event = data.get('event')

        if event == 'charge.success':
            self._handle_charge_success(data['data'])
        elif event == 'subscription.create':
            self._handle_subscription_create(data['data'])

        return Response(status=200)

    def _handle_charge_success(self, data):
        reference = data.get('reference')
        email = data.get('customer', {}).get('email')
        amount = data.get('amount') / 100 # Paystack returns amount in kobo

        try:
            transaction = Transaction.objects.get(reference=reference)
            transaction.status = 'SUCCESS'
            transaction.save()
            
            # Update subscription status if linked
            subscription = Subscription.objects.get(tenant=transaction.tenant)
            subscription.is_active = True
            subscription.save()
            
        except Transaction.DoesNotExist:
            pass

    def _handle_subscription_create(self, data):
        # Implementation for automated subscription creation
        pass

class FlutterwaveWebhookView(APIView):
    """
    Webhook handler for Flutterwave events.
    """
    permission_classes = [] 

    @csrf_exempt
    def post(self, request, *args, **kwargs):
        # Verification logic for Flutterwave hash
        # SECRET_HASH = getattr(settings, 'FLUTTERWAVE_SECRET_HASH', '')
        # ...
        return Response(status=200)
