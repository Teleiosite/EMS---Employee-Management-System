import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ShieldCheck, 
  Zap, 
  Crown, 
  ArrowRight, 
  AlertCircle, 
  History,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchPlans, initializePayment, fetchSubscriptionStatus, Plan } from '../services/billingApi';

// Extend window to include PaystackPop
declare global {
  interface Window {
    PaystackPop: any;
  }
}

const Billing: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{ tier: string; limit: number; count: number } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [plansData, statusData] = await Promise.all([
          fetchPlans(),
          fetchSubscriptionStatus()
        ]);
        setPlans(plansData);
        setSubscriptionStatus(statusData);
      } catch (err) {
        showToast('Failed to load billing data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleUpgrade = async (plan: Plan) => {
    if (user?.subscriptionTier === plan.id) {
      showToast('info', 'You are already on this plan.');
      return;
    }

    setProcessingId(plan.id);
    try {
      const amount = isAnnual ? plan.annual_price : plan.price;
      const paymentData = await initializePayment(plan.id, amount);

      const handler = window.PaystackPop.setup({
        key: paymentData.public_key,
        email: paymentData.email,
        amount: paymentData.amount,
        currency: 'NGN',
        ref: paymentData.reference,
        callback: (response: any) => {
          showToast('success', 'Payment successful! Your subscription is being updated.');
          // Refresh page to update AuthContext state
          setTimeout(() => window.location.reload(), 2000);
        },
        onClose: () => {
          setProcessingId(null);
          showToast('info', 'Payment cancelled.');
        }
      });
      handler.openIframe();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to initialize payment.', 'error');
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header & Current Status */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Billing & Subscriptions</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Manage your organization's plan, view transaction history, and upgrade to unlock advanced enterprise features.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Current Plan</p>
            <p className="text-lg font-bold text-gray-900">{subscriptionStatus?.tier || user?.subscriptionTier || 'FREE TRIAL'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Usage Status</p>
            <p className="text-lg font-bold text-gray-900">
              {subscriptionStatus ? `${subscriptionStatus.count} / ${subscriptionStatus.limit}` : '0 / 5'} Employees
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-xl text-green-600">
            <History className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Auto-Renewal</p>
            <p className="text-lg font-bold text-gray-900">Active</p>
          </div>
        </div>
      </div>

      {/* Pricing Toggle */}
      <div className="flex flex-col items-center mb-12">
        <div className="relative bg-gray-100 p-1 rounded-xl flex items-center w-64 mb-4">
          <button 
            onClick={() => setIsAnnual(false)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg z-10 transition-all ${!isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setIsAnnual(true)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg z-10 transition-all ${isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Annual
          </button>
        </div>
        <p className="text-xs font-bold text-orange-600 tracking-wide uppercase">Save 2 months with yearly billing</p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {Array.isArray(plans) && plans.map((plan) => (
          <div 
            key={plan.id}
            className={`relative p-8 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
              plan.id === 'BUSINESS' 
                ? 'bg-white border-orange-200 shadow-md ring-4 ring-orange-50' 
                : 'bg-white border-gray-100'
            }`}
          >
            {plan.id === 'BUSINESS' && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                Most Popular
              </span>
            )}

            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900">
                  ₦{(Number(isAnnual ? plan.annual_price : plan.price) || 0).toLocaleString()}
                </span>
                <span className="text-gray-400 font-medium">/{isAnnual ? 'yr' : 'mo'}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Perfect for growing teams up to {plan.limit === 999999 ? 'unlimited' : plan.limit} employees.</p>
            </div>

            <ul className="space-y-4 mb-10">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="bg-green-100 p-1 rounded-full text-green-600">
                    <Check className="w-3 h-3" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan)}
              disabled={processingId !== null || user?.subscriptionTier === plan.id}
              className={`w-full py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                user?.subscriptionTier === plan.id
                  ? 'bg-gray-100 text-gray-400 cursor-default'
                  : plan.id === 'BUSINESS'
                    ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-200'
                    : 'bg-gray-900 text-white hover:bg-black overflow-hidden'
              }`}
            >
              {processingId === plan.id ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {user?.subscriptionTier === plan.id ? 'Current Plan' : 'Select Plan'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Security Disclaimer */}
      <div className="mt-16 bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 flex items-start gap-4">
        <div className="bg-white p-2 rounded-lg text-gray-400 shadow-sm border border-gray-100">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-800 mb-1">Secure Payments by Paystack</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Your payment sensitive information is never stored on our servers. All transactions are handled securely through Paystack, a PCI-DSS certified payment processor. All connections are encrypted via SSL.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Billing;
