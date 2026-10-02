import { Request, Response } from 'express';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import {
  SUBSCRIPTION_PLANS,
  createSubscriptionCheckoutSession,
  verifyRazorpaySignature,
  fulfillSubscription,
  processStripeWebhookEvent,
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
  req: Request<{}, {}, CheckoutSubscriptionInput & { gateway?: 'stripe' | 'razorpay' | 'auto' }>,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;
  const { planId, gateway = 'auto' } = req.body;
  const origin = req.headers.origin || req.headers.referer?.replace(/\/+$/, '');

  try {
    const result = await createSubscriptionCheckoutSession(userId, planId, gateway, origin);

    if (result.mode === 'stripe') {
      res.status(200).json({
        success: true,
        mode: 'stripe',
        data: {
          checkoutUrl: result.checkoutUrl,
        },
      });
      return;
    }

    if (result.mode === 'razorpay') {
      res.status(200).json({
        success: true,
        mode: 'razorpay',
        data: {
          orderId: result.orderId,
          keyId: result.keyId,
          amountINR: SUBSCRIPTION_PLANS[planId].priceINR,
          planName: SUBSCRIPTION_PLANS[planId].name,
        },
      });
      return;
    }

    // Mock Mode
    res.status(200).json({
      success: true,
      mode: 'mock',
      message: 'Subscription activated successfully (Simulation Mode)',
      data: {
        subscription: result.subscription,
        mockPaymentId: result.mockPaymentId,
        note: 'This is a simulated transaction. No real funds were charged.',
      },
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: { message: err.message || 'Subscription checkout failed' },
    });
  }
}

export async function verifyRazorpaySubscription(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { orderId, paymentId, signature, planId } = req.body;

  const isValid = verifyRazorpaySignature(orderId, paymentId, signature);
  if (!isValid) {
    res.status(400).json({
      success: false,
      error: { message: 'Invalid payment signature verification' },
    });
    return;
  }

  try {
    const subscription = await fulfillSubscription(userId, planId, 'razorpay', paymentId);
    res.status(200).json({
      success: true,
      message: 'Subscription verified and activated successfully',
      data: subscription,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { message: err.message || 'Failed to activate subscription' },
    });
  }
}

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string;
  if (!sig) {
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  try {
    const result = await processStripeWebhookEvent(req.body, sig);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
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
