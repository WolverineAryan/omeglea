export type SubscriptionPlanId = 'weekly' | 'monthly' | 'quarterly';

export type SubscriptionStatus = 'active' | 'pending' | 'expired' | 'cancelled' | 'failed';

export interface ISubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceINR: number;
  durationDays: number;
  features: string[];
  popular?: boolean;
}

export interface ISubscription {
  id: string;
  userId: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string;
  paymentProvider: 'mock' | 'razorpay' | 'stripe';
  createdAt: string;
}

export interface ICreditPackage {
  id: string;
  credits: number;
  priceINR: number;
  popular?: boolean;
  bonus?: number;
}

export interface ICreditTransaction {
  id: string;
  userId: string;
  transactionType: 'purchase' | 'spend' | 'refund' | 'bonus';
  creditAmount: number;
  paymentAmountINR?: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  externalPaymentId?: string;
  createdAt: string;
}
