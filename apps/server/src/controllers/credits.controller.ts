import { Request, Response } from 'express';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { User } from '../models/User.js';
import {
  CREDIT_PACKAGES,
  processMockCreditPurchase,
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
  req: Request<{}, {}, CheckoutCreditsInput>,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;
  const { packageId } = req.body;
  const idempotencyKey = req.headers['idempotency-key'] as string;

  try {
    const { transaction, newBalance } = await processMockCreditPurchase(
      userId,
      packageId,
      idempotencyKey
    );

    res.status(200).json({
      success: true,
      message: 'Credits added successfully (Simulation Mode)',
      data: {
        transaction,
        newBalance,
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
