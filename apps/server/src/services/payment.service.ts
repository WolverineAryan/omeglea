import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { Subscription, ISubscriptionDocument } from '../models/Subscription.js';
import { CreditTransaction, ICreditTransactionDocument } from '../models/CreditTransaction.js';
import { User } from '../models/User.js';
import { SubscriptionPlanId, ISubscriptionPlan, ICreditPackage } from '@omeglea/shared';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Initialize Stripe Client
let stripeClient: Stripe | null = null;
if (env.STRIPE_SECRET_KEY) {
  try {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia' as any,
    });
  } catch (err: any) {
    logger.warn('Failed to initialize Stripe client:', err.message);
  }
}

// Initialize Razorpay Client
let razorpayClient: any = null;
if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  try {
    razorpayClient = new (Razorpay as any)({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  } catch (err: any) {
    logger.warn('Failed to initialize Razorpay client:', err.message);
  }
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, ISubscriptionPlan> = {
  weekly: {
    id: 'weekly',
    name: 'Weekly Pass',
    priceINR: 99,
    durationDays: 7,
    features: [
      'Ad-free experience',
      'Expanded matching preferences (Interests & Language)',
      'Unlimited video chat connections',
      'Premium profile badge',
      'Priority matching queue',
    ],
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly Pro',
    priceINR: 199,
    durationDays: 30,
    features: [
      'Ad-free experience',
      'Expanded matching preferences (Interests & Language)',
      'Unlimited video chat connections',
      'Premium profile badge',
      'Priority matching queue',
      '100 bonus credits included',
    ],
    popular: true,
  },
  quarterly: {
    id: 'quarterly',
    name: 'Quarterly VIP',
    priceINR: 499,
    durationDays: 90,
    features: [
      'Ad-free experience',
      'Expanded matching preferences (Interests, Language, Country)',
      'Unlimited video chat connections',
      'VIP badge & custom profile effects',
      'Highest priority queue',
      '300 bonus credits included',
    ],
  },
};

export const CREDIT_PACKAGES: ICreditPackage[] = [
  { id: 'pkg_50', credits: 50, priceINR: 49 },
  { id: 'pkg_150', credits: 150, priceINR: 129, popular: true, bonus: 20 },
  { id: 'pkg_500', credits: 500, priceINR: 399, bonus: 100 },
];

// -------------------------------------------------------------
// FULFILLMENT HELPERS
// -------------------------------------------------------------
export async function fulfillSubscription(
  userId: string,
  planId: SubscriptionPlanId,
  provider: 'stripe' | 'razorpay' | 'mock',
  externalId: string
): Promise<ISubscriptionDocument> {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) throw new Error('Invalid subscription plan');

  const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

  // Cancel prior active subscriptions
  await Subscription.updateMany(
    { userId, status: 'active' },
    { $set: { status: 'cancelled' } }
  );

  const subscription = await Subscription.create({
    userId,
    planId,
    status: 'active',
    startedAt: new Date(),
    expiresAt,
    paymentProvider: provider,
    externalSubscriptionId: externalId,
  });

  let bonusCredits = 0;
  if (planId === 'monthly') bonusCredits = 100;
  if (planId === 'quarterly') bonusCredits = 300;

  await User.findByIdAndUpdate(userId, {
    $set: {
      isPremium: true,
      role: 'premium',
      premiumExpiresAt: expiresAt,
    },
    $inc: { creditBalance: bonusCredits },
  });

  if (bonusCredits > 0) {
    await CreditTransaction.create({
      userId,
      transactionType: 'bonus',
      creditAmount: bonusCredits,
      status: 'completed',
      description: `Bonus credits with ${plan.name}`,
    });
  }

  logger.info(`[PAYMENT FULFILLED] Subscribed user ${userId} to ${planId} via ${provider}`);
  return subscription;
}

export async function fulfillCreditPurchase(
  userId: string,
  packageId: string,
  provider: 'stripe' | 'razorpay' | 'mock',
  externalPaymentId: string,
  idempotencyKey?: string
): Promise<{ transaction: ICreditTransactionDocument; newBalance: number }> {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) throw new Error('Invalid credit package');

  if (idempotencyKey) {
    const existing = await CreditTransaction.findOne({ idempotencyKey });
    if (existing) {
      const user = await User.findById(userId);
      return { transaction: existing, newBalance: user?.creditBalance || 0 };
    }
  }

  const totalCredits = pkg.credits + (pkg.bonus || 0);

  const transaction = await CreditTransaction.create({
    userId,
    transactionType: 'purchase',
    creditAmount: totalCredits,
    paymentAmountINR: pkg.priceINR,
    status: 'completed',
    description: `Purchased ${pkg.credits} credits package`,
    externalPaymentId,
    idempotencyKey,
  });

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { creditBalance: totalCredits } },
    { new: true }
  );

  logger.info(`[PAYMENT FULFILLED] Added ${totalCredits} credits to user ${userId} via ${provider}`);
  return { transaction, newBalance: updatedUser?.creditBalance || 0 };
}

// -------------------------------------------------------------
// CHECKOUT CREATION (STRIPE / RAZORPAY / MOCK)
// -------------------------------------------------------------

export async function createSubscriptionCheckoutSession(
  userId: string,
  planId: SubscriptionPlanId,
  gateway: 'stripe' | 'razorpay' | 'auto' = 'auto',
  clientBaseUrl?: string
): Promise<{
  mode: 'stripe' | 'razorpay' | 'mock';
  checkoutUrl?: string;
  orderId?: string;
  keyId?: string;
  subscription?: ISubscriptionDocument;
  mockPaymentId?: string;
}> {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) throw new Error('Invalid plan selected');

  const baseOrigin = clientBaseUrl || env.CLIENT_URL;

  // 1. Stripe Checkout Session
  if ((gateway === 'stripe' || gateway === 'auto') && stripeClient && env.PAYMENT_MODE === 'live') {
    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `Omeglea ${plan.name}`,
              description: `18+ Video Chat Premium Membership (${plan.durationDays} Days)`,
            },
            unit_amount: plan.priceINR * 100, // in paise / cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planId,
        type: 'subscription',
      },
      success_url: `${baseOrigin}/pricing?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${baseOrigin}/pricing?status=cancelled`,
    });

    return {
      mode: 'stripe',
      checkoutUrl: session.url || undefined,
    };
  }

  // 2. Razorpay Order
  if ((gateway === 'razorpay' || gateway === 'auto') && razorpayClient && env.PAYMENT_MODE === 'live') {
    const order = await razorpayClient.orders.create({
      amount: plan.priceINR * 100,
      currency: 'INR',
      receipt: `sub_${userId.slice(-6)}_${Date.now()}`,
      notes: {
        userId,
        planId,
        type: 'subscription',
      },
    });

    return {
      mode: 'razorpay',
      orderId: order.id,
      keyId: env.RAZORPAY_KEY_ID,
    };
  }

  // 3. Fallback: Instant Simulation Mock
  const mockPaymentId = `mock_sub_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
  const subscription = await fulfillSubscription(userId, planId, 'mock', mockPaymentId);
  return {
    mode: 'mock',
    subscription,
    mockPaymentId,
  };
}

export async function createCreditCheckoutSession(
  userId: string,
  packageId: string,
  gateway: 'stripe' | 'razorpay' | 'auto' = 'auto',
  clientBaseUrl?: string
): Promise<{
  mode: 'stripe' | 'razorpay' | 'mock';
  checkoutUrl?: string;
  orderId?: string;
  keyId?: string;
  transaction?: ICreditTransactionDocument;
  newBalance?: number;
}> {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) throw new Error('Invalid credit package selected');

  const baseOrigin = clientBaseUrl || env.CLIENT_URL;

  // 1. Stripe Checkout Session
  if ((gateway === 'stripe' || gateway === 'auto') && stripeClient && env.PAYMENT_MODE === 'live') {
    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `Omeglea ${pkg.credits} Credits (+${pkg.bonus || 0} Bonus)`,
              description: `Chat & Video Credits for Omeglea`,
            },
            unit_amount: pkg.priceINR * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        packageId,
        type: 'credits',
      },
      success_url: `${baseOrigin}/pricing?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${baseOrigin}/pricing?status=cancelled`,
    });

    return {
      mode: 'stripe',
      checkoutUrl: session.url || undefined,
    };
  }

  // 2. Razorpay Order
  if ((gateway === 'razorpay' || gateway === 'auto') && razorpayClient && env.PAYMENT_MODE === 'live') {
    const order = await razorpayClient.orders.create({
      amount: pkg.priceINR * 100,
      currency: 'INR',
      receipt: `crd_${userId.slice(-6)}_${Date.now()}`,
      notes: {
        userId,
        packageId,
        type: 'credits',
      },
    });

    return {
      mode: 'razorpay',
      orderId: order.id,
      keyId: env.RAZORPAY_KEY_ID,
    };
  }

  // 3. Fallback: Instant Simulation Mock
  const mockPaymentId = `mock_tx_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
  const { transaction, newBalance } = await fulfillCreditPurchase(
    userId,
    packageId,
    'mock',
    mockPaymentId
  );
  return {
    mode: 'mock',
    transaction,
    newBalance,
  };
}

// -------------------------------------------------------------
// WEBHOOK & VERIFICATION PROCESSORS
// -------------------------------------------------------------

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const hmac = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET);
  hmac.update(`${orderId}|${paymentId}`);
  const expected = hmac.digest('hex');
  return expected === signature;
}

export async function processStripeWebhookEvent(
  rawBody: Buffer | string,
  signature: string
): Promise<{ success: boolean; eventType?: string }> {
  if (!stripeClient || !env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Stripe Webhook Secret not configured');
  }

  const event = stripeClient.webhooks.constructEvent(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const type = session.metadata?.type;

    if (userId && type === 'subscription') {
      const planId = session.metadata?.planId as SubscriptionPlanId;
      if (planId) {
        await fulfillSubscription(userId, planId, 'stripe', session.id);
      }
    } else if (userId && type === 'credits') {
      const packageId = session.metadata?.packageId;
      if (packageId) {
        await fulfillCreditPurchase(userId, packageId, 'stripe', session.id);
      }
    }
  }

  return { success: true, eventType: event.type };
}

// Backwards compatibility for existing controller calls
export const processMockSubscription = (userId: string, planId: SubscriptionPlanId) =>
  fulfillSubscription(userId, planId, 'mock', `mock_sub_${Date.now()}`).then((sub) => ({
    subscription: sub,
    mockPaymentId: sub.externalSubscriptionId || 'mock',
  }));

export const processMockCreditPurchase = (
  userId: string,
  packageId: string,
  idempotencyKey?: string
) => fulfillCreditPurchase(userId, packageId, 'mock', `mock_tx_${Date.now()}`, idempotencyKey);

