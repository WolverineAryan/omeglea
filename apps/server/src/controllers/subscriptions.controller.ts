import { Request, Response } from 'express';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import {
  SUBSCRIPTION_PLANS,
  processMockSubscription,
} from '../services/payment.service.js';
import { CheckoutSubscriptionInput } from '@omeglea/shared';

export async function listSubscriptionPlans(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    data: Object.values(SUBSCRIPTION_PLANS),
  });
}

export async function getMySubscription(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const subscription = await Subscription.findOne({
    userId,
    status: 'active',
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: subscription || null,
  });
}

export async function checkoutSubscription(
  req: Request<{}, {}, CheckoutSubscriptionInput>,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;
  const { planId } = req.body;

  try {
    const { subscription, mockPaymentId } = await processMockSubscription(userId, planId);

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully (Simulation Mode)',
      data: {
        subscription,
        mockPaymentId,
        note: 'This is a simulated transaction. No real funds were charged.',
      },
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: { message: err.message || 'Subscription processing failed' },
    });
  }
}

export async function cancelSubscription(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const subscription = await Subscription.findOneAndUpdate(
    { userId, status: 'active' },
    { $set: { status: 'cancelled' } },
    { new: true }
  );

  if (!subscription) {
    res.status(404).json({
      success: false,
      error: { message: 'No active subscription found to cancel' },
    });
    return;
  }

  // Update user model back to free role
  await User.findByIdAndUpdate(userId, {
    isPremium: false,
    role: 'free',
  });

  res.status(200).json({
    success: true,
    message: 'Subscription cancelled successfully',
    data: subscription,
  });
}
