import { Request, Response } from 'express';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { User } from '../models/User.js';
import {
  CREDIT_PACKAGES,
  createCreditCheckoutSession,
  verifyRazorpaySignature,
  fulfillCreditPurchase,
} from '../services/payment.service.js';
import { CheckoutCreditsInput } from '@omeglea/shared';

export async function listCreditPackages(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    data: CREDIT_PACKAGES,
  });
}

export async function getCreditBalance(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const user = await User.findById(userId).select('creditBalance').lean();

  res.status(200).json({
    success: true,
    data: {
      creditBalance: user?.creditBalance || 0,
    },
  });
}

export async function listCreditTransactions(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 50);

  const transactions = await CreditTransaction.find({ userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await CreditTransaction.countDocuments({ userId });

  res.status(200).json({
    success: true,
    data: {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}

export async function checkoutCredits(
  req: Request<{}, {}, CheckoutCreditsInput & { gateway?: 'stripe' | 'razorpay' | 'auto' }>,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;
  const { packageId, gateway = 'auto' } = req.body;
  const origin = req.headers.origin || req.headers.referer?.replace(/\/+$/, '');

  try {
    const result = await createCreditCheckoutSession(userId, packageId, gateway, origin);

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

    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);

    if (result.mode === 'razorpay') {
      res.status(200).json({
        success: true,
        mode: 'razorpay',
        data: {
          orderId: result.orderId,
          keyId: result.keyId,
          amountINR: pkg?.priceINR || 0,
          packageName: `${pkg?.credits} Credits`,
        },
      });
      return;
    }

    // Mock Mode
    res.status(200).json({
      success: true,
      mode: 'mock',
      message: 'Credits added successfully (Simulation Mode)',
      data: {
        transaction: result.transaction,
        newBalance: result.newBalance,
        note: 'This is a simulated transaction. No real funds were charged.',
      },
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: { message: err.message || 'Credit purchase failed' },
    });
  }
}

export async function verifyRazorpayCredits(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { orderId, paymentId, signature, packageId } = req.body;

  const isValid = verifyRazorpaySignature(orderId, paymentId, signature);
  if (!isValid) {
    res.status(400).json({
      success: false,
      error: { message: 'Invalid payment signature verification' },
    });
    return;
  }

  try {
    const { transaction, newBalance } = await fulfillCreditPurchase(
      userId,
      packageId,
      'razorpay',
      paymentId
    );
    res.status(200).json({
      success: true,
      message: 'Payment verified and credits added successfully',
      data: { transaction, newBalance },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { message: err.message || 'Failed to award credits' },
    });
  }
}
