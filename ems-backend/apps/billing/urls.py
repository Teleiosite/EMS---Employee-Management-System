from django.urls import path
from .views import PaystackWebhookview, FlutterwaveWebhookView, InitializePaymentView, PlanInfoView, SubscriptionStatusView

urlpatterns = [
    path('plans/', PlanInfoView.as_view(), name='plan_info'),
    path('status/', SubscriptionStatusView.as_view(), name='subscription_status'),
    path('payments/initialize/', InitializePaymentView.as_view(), name='payment_initialize'),
    path('webhooks/paystack/', PaystackWebhookview.as_view(), name='paystack_webhook'),
    path('webhooks/flutterwave/', FlutterwaveWebhookView.as_view(), name='flutterwave_webhook'),
]
