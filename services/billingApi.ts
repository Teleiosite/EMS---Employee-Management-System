import api from './api';

export interface Plan {
  id: string;
  name: string;
  price: number;
  annual_price: number;
  limit: number;
  features: string[];
}

export interface PaymentInitResponse {
  reference: string;
  public_key: string;
  email: string;
  amount: number;
}

export const fetchPlans = async (): Promise<Plan[]> => {
  const response: any = await api.get('/billing/plans/');
  // Ensure we return an array even if something wraps the response
  return Array.isArray(response) ? response : (response?.data || []);
};

export const initializePayment = async (planId: string, amount: number): Promise<PaymentInitResponse> => {
  const response: any = await api.post('/billing/payments/initialize/', {
    plan_id: planId,
    amount,
  });
  return response;
};

export const fetchTransactions = async () => {
  const response: any = await api.get('/billing/transactions/');
  return response;
};

export const fetchSubscriptionStatus = async (): Promise<{ tier: string; limit: number; count: number }> => {
  const response: any = await api.get('/billing/status/');
  return response?.data || response;
};
