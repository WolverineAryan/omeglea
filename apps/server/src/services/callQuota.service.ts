import { User } from '../models/User.js';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { logger } from '../utils/logger.js';

export interface QuotaCheckResult {
  allowed: boolean;
  tier: 'free' | 'pro' | 'vip';
  dailyCallsUsed: number;
  dailyCallsLimit: number;
  remainingDailyCalls: number;
  creditBalance: number;
  willUseCredit: boolean;
  message?: string;
  code?: string;
}

export function getDailyCallLimit(role: string, isPremium: boolean): { limit: number; tier: 'free' | 'pro' | 'vip' } {
  if (role === 'vip') {
    return { limit: 500, tier: 'vip' };
  }
  if (role === 'premium' || isPremium) {
    return { limit: 100, tier: 'pro' };
  }
  return { limit: 10, tier: 'free' };
}

export async function checkCallQuota(userId: string): Promise<QuotaCheckResult> {
  const user = await User.findById(userId);
  if (!user) {
    return {
      allowed: false,
      tier: 'free',
      dailyCallsUsed: 0,
      dailyCallsLimit: 10,
      remainingDailyCalls: 0,
      creditBalance: 0,
      willUseCredit: false,
      message: 'User account not found',
      code: 'USER_NOT_FOUND',
    };
  }

  const today = new Date().toISOString().split('T')[0];
  let dailyCallsUsed = user.dailyCallsUsed || 0;

  // Reset daily call counter if this is the first call of a new day
  if (user.lastCallDate !== today) {
    dailyCallsUsed = 0;
    user.dailyCallsUsed = 0;
    user.lastCallDate = today;
    await user.save();
  }

  const { limit: dailyCallsLimit, tier } = getDailyCallLimit(user.role, user.isPremium);
  const remainingDailyCalls = Math.max(0, dailyCallsLimit - dailyCallsUsed);
  const creditBalance = user.creditBalance || 0;

  // 1. User has free/subscription daily calls available
  if (dailyCallsUsed < dailyCallsLimit) {
    return {
      allowed: true,
      tier,
      dailyCallsUsed,
      dailyCallsLimit,
      remainingDailyCalls,
      creditBalance,
      willUseCredit: false,
    };
  }

  // 2. Daily calls exhausted, but user has at least 1 credit (1 credit = 1 call)
  if (creditBalance >= 1) {
    return {
      allowed: true,
      tier,
      dailyCallsUsed,
      dailyCallsLimit,
      remainingDailyCalls: 0,
      creditBalance,
      willUseCredit: true,
      message: `Daily ${dailyCallsLimit} call limit reached. Using 1 credit for this call.`,
    };
  }

  // 3. Quota exhausted and no credits available
  const tierName = tier === 'vip' ? 'VIP (500/day)' : tier === 'pro' ? 'PRO (100/day)' : 'Free (10/day)';
  return {
    allowed: false,
    tier,
    dailyCallsUsed,
    dailyCallsLimit,
    remainingDailyCalls: 0,
    creditBalance: 0,
    willUseCredit: false,
    code: 'DAILY_LIMIT_REACHED',
    message: `You have reached your daily limit of ${dailyCallsLimit} calls on the ${tierName} plan. Upgrade your membership or buy credits (5 credits for ₹2, 1 credit = 1 call) to continue chatting!`,
  };
}

export async function consumeCallQuota(
  userId: string,
  sessionId?: string
): Promise<{ usedCredit: boolean; remainingCredits: number; dailyCallsUsed: number }> {
  const user = await User.findById(userId);
  if (!user) {
    return { usedCredit: false, remainingCredits: 0, dailyCallsUsed: 0 };
  }

  const today = new Date().toISOString().split('T')[0];
  if (user.lastCallDate !== today) {
    user.dailyCallsUsed = 0;
    user.lastCallDate = today;
  }

  const { limit: dailyCallsLimit } = getDailyCallLimit(user.role, user.isPremium);

  if (user.dailyCallsUsed < dailyCallsLimit) {
    // Consume 1 daily quota call
    user.dailyCallsUsed += 1;
    await user.save();
    logger.info(`[QUOTA] User ${userId} consumed daily call #${user.dailyCallsUsed}/${dailyCallsLimit}`);
    return {
      usedCredit: false,
      remainingCredits: user.creditBalance || 0,
      dailyCallsUsed: user.dailyCallsUsed,
    };
  }

  // Consume 1 credit
  if ((user.creditBalance || 0) >= 1) {
    user.creditBalance = Math.max(0, user.creditBalance - 1);
    await user.save();

    await CreditTransaction.create({
      userId,
      transactionType: 'spend',
      creditAmount: 1,
      status: 'completed',
      description: `1 Credit used for live video call (${sessionId || 'direct match'})`,
    });

    logger.info(`[CREDIT SPENT] User ${userId} spent 1 credit for call. Balance: ${user.creditBalance}`);
    return {
      usedCredit: true,
      remainingCredits: user.creditBalance,
      dailyCallsUsed: user.dailyCallsUsed,
    };
  }

  return {
    usedCredit: false,
    remainingCredits: 0,
    dailyCallsUsed: user.dailyCallsUsed,
  };
}
