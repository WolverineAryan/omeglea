import { v4 as uuidv4 } from 'uuid';
import { Subscription, ISubscriptionDocument } from '../models/Subscription.js';
import { CreditTransaction, ICreditTransactionDocument } from '../models/CreditTransaction.js';
import { User } from '../models/User.js';
import { SubscriptionPlanId, ISubscriptionPlan, ICreditPackage } from '@omeglea/shared';
import { logger } from '../utils/logger.js';

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

export async function processMockSubscription(
  userId: string,
  planId: SubscriptionPlanId
): Promise<{ subscription: ISubscriptionDocument; mockPaymentId: string }> {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error('Invalid subscription plan');
  }

  const mockPaymentId = `mock_sub_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
  const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

  // Deactivate existing active subscriptions
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
    paymentProvider: 'mock',
    externalSubscriptionId: mockPaymentId,
  });

  // Update user model
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

  logger.info(`[MOCK PAYMENT] Subscribed user ${userId} to ${planId}`);
  return { subscription, mockPaymentId };
}

export async function processMockCreditPurchase(
  userId: string,
  packageId: string,
  idempotencyKey?: string
): Promise<{ transaction: ICreditTransactionDocument; newBalance: number }> {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    throw new Error('Invalid credit package');
  }

  // Idempotency check to prevent duplicate charges
  if (idempotencyKey) {
    const existing = await CreditTransaction.findOne({ idempotencyKey });
    if (existing) {
      const user = await User.findById(userId);
      return { transaction: existing, newBalance: user?.creditBalance || 0 };
    }
  }

  const totalCredits = pkg.credits + (pkg.bonus || 0);
  const mockPaymentId = `mock_tx_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

  const transaction = await CreditTransaction.create({
    userId,
    transactionType: 'purchase',
    creditAmount: totalCredits,
    paymentAmountINR: pkg.priceINR,
    status: 'completed',
    description: `Purchased ${pkg.credits} credits package`,
    externalPaymentId: mockPaymentId,
    idempotencyKey,
  });

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { creditBalance: totalCredits } },
    { new: true }
  );

  logger.info(`[MOCK PAYMENT] Added ${totalCredits} credits to user ${userId}`);
  return { transaction, newBalance: updatedUser?.creditBalance || 0 };
}
