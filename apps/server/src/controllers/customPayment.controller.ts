import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PaymentOrder } from '../models/PaymentOrder.js';
import { Voucher } from '../models/Voucher.js';
import { User } from '../models/User.js';
import {
  SUBSCRIPTION_PLANS,
  CREDIT_PACKAGES,
  fulfillSubscription,
  fulfillCreditPurchase,
} from '../services/payment.service.js';
import { env } from '../config/env.js';
import { SubscriptionPlanId } from '@omeglea/shared';

// Generate dynamic UPI URI string
function generateUpiUri(merchantId: string, merchantName: string, amount: number, orderId: string): string {
  return `upi://pay?pa=${merchantId}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Omeglea ${orderId}`)}`;
}

// 1. Create a custom Direct UPI Payment Order
export async function createUpiOrder(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { orderType, itemId } = req.body;

  if (!orderType || !itemId) {
    res.status(400).json({
      success: false,
      error: { message: 'orderType (subscription/credits) and itemId are required' },
    });
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ success: false, error: { message: 'User not found' } });
    return;
  }

  let amountINR = 0;
  let itemName = '';

  if (orderType === 'subscription') {
    const plan = SUBSCRIPTION_PLANS[itemId as SubscriptionPlanId];
    if (!plan) {
      res.status(400).json({ success: false, error: { message: `Invalid subscription planId: ${itemId}` } });
      return;
    }
    amountINR = plan.priceINR;
    itemName = plan.name;
  } else if (orderType === 'credits') {
    const pkg = CREDIT_PACKAGES.find((p) => p.id === itemId);
    if (!pkg) {
      res.status(400).json({ success: false, error: { message: `Invalid credit packageId: ${itemId}` } });
      return;
    }
    amountINR = pkg.priceINR;
    itemName = `${pkg.credits} Credits (+${pkg.bonus} Bonus)`;
  } else {
    res.status(400).json({ success: false, error: { message: 'Invalid orderType' } });
    return;
  }

  const orderId = `OMGL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const upiMerchantId = env.UPI_MERCHANT_ID || 'omeglea@upi';
  const upiMerchantName = env.UPI_MERCHANT_NAME || 'Omeglea';
  const upiUri = generateUpiUri(upiMerchantId, upiMerchantName, amountINR, orderId);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;

  const paymentOrder = await PaymentOrder.create({
    orderId,
    userId,
    orderType,
    itemId,
    itemName,
    amountINR,
    upiMerchantId,
    status: 'pending',
    userEmail: user.email,
    userDisplayName: user.displayName,
  });

  res.status(201).json({
    success: true,
    data: {
      orderId: paymentOrder.orderId,
      orderType,
      itemId,
      itemName,
      amountINR,
      upiMerchantId,
      upiMerchantName,
      upiUri,
      qrCodeUrl,
      instructions: [
        '1. Scan QR code using Google Pay, PhonePe, Paytm, CRED, or BHIM UPI app',
        '2. Or click the "Open UPI App" button directly on mobile',
        '3. Complete payment of exact amount',
        '4. Copy the 12-digit UTR / Bank Reference Number from payment receipt',
        '5. Paste UTR number below and click "Verify & Activate"',
      ],
    },
  });
}

// 2. Submit 12-Digit UTR for Verification & Activation
export async function submitUpiUtr(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { orderId, utrNumber } = req.body;

  if (!orderId || !utrNumber) {
    res.status(400).json({
      success: false,
      error: { message: 'orderId and utrNumber are required' },
    });
    return;
  }

  const cleanUtr = String(utrNumber).trim();
  if (cleanUtr.length < 6 || cleanUtr.length > 30) {
    res.status(400).json({
      success: false,
      error: { message: 'Please enter a valid 12-digit UTR / Transaction reference number' },
    });
    return;
  }

  // Check if UTR is already completed on another order
  const existingCompleted = await PaymentOrder.findOne({
    utrNumber: cleanUtr,
    status: 'completed',
  });

  if (existingCompleted) {
    res.status(400).json({
      success: false,
      error: { message: 'This UTR / Transaction Reference has already been redeemed.' },
    });
    return;
  }

  const order = await PaymentOrder.findOne({ orderId, userId });
  if (!order) {
    res.status(404).json({
      success: false,
      error: { message: 'Payment order not found' },
    });
    return;
  }

  if (order.status === 'completed') {
    res.status(400).json({
      success: false,
      error: { message: 'This order has already been completed.' },
    });
    return;
  }

  order.utrNumber = cleanUtr;

  // Check Auto-Approve setting
  if (env.AUTO_APPROVE_UPI_PAYMENTS) {
    order.status = 'completed';
    order.verifiedAt = new Date();
    await order.save();

    let fulfillmentResult: any = null;
    if (order.orderType === 'subscription') {
      fulfillmentResult = await fulfillSubscription(
        userId,
        order.itemId as SubscriptionPlanId,
        'razorpay',
        `UPI-${cleanUtr}`
      );
    } else if (order.orderType === 'credits') {
      fulfillmentResult = await fulfillCreditPurchase(
        userId,
        order.itemId,
        'razorpay',
        `UPI-${cleanUtr}`
      );
    }

    const updatedUser = await User.findById(userId);

    res.status(200).json({
      success: true,
      status: 'completed',
      message: `Payment verified! ${order.itemName} has been activated.`,
      data: {
        order,
        fulfillment: fulfillmentResult,
        user: {
          role: updatedUser?.role,
          isPremium: updatedUser?.isPremium,
          creditBalance: updatedUser?.creditBalance,
          dailyCallsLimit: updatedUser?.role === 'vip' ? 500 : updatedUser?.isPremium ? 100 : 10,
        },
      },
    });
    return;
  }

  // Manual Review Mode
  order.status = 'pending';
  await order.save();

  res.status(200).json({
    success: true,
    status: 'pending',
    message: 'UTR submitted! Your transaction is under review and will be activated shortly.',
    data: { order },
  });
}

// 3. Redeem Voucher / Promo Code
export async function redeemVoucherCode(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ success: false, error: { message: 'Promo code is required' } });
    return;
  }

  const cleanCode = String(code).trim().toUpperCase();
  const voucher = await Voucher.findOne({ code: cleanCode, isActive: true });

  if (!voucher) {
    res.status(404).json({ success: false, error: { message: 'Invalid or expired promo code' } });
    return;
  }

  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    res.status(400).json({ success: false, error: { message: 'This promo code has expired' } });
    return;
  }

  if (voucher.usedCount >= voucher.maxUses) {
    res.status(400).json({ success: false, error: { message: 'This promo code has reached its maximum usage limit' } });
    return;
  }

  if (voucher.usedBy.some((id) => id.toString() === userId)) {
    res.status(400).json({ success: false, error: { message: 'You have already redeemed this promo code' } });
    return;
  }

  // Apply Voucher benefit
  if (voucher.type === 'credits') {
    await User.findByIdAndUpdate(userId, {
      $inc: { creditBalance: voucher.value },
    });
  } else if (voucher.type === 'subscription' && voucher.planId) {
    await fulfillSubscription(userId, voucher.planId as SubscriptionPlanId, 'mock', `VOUCHER-${cleanCode}`);
  }

  voucher.usedCount += 1;
  voucher.usedBy.push(userId as any);
  await voucher.save();

  const updatedUser = await User.findById(userId);

  res.status(200).json({
    success: true,
    message: `Promo code redeemed successfully! ${voucher.type === 'credits' ? `+${voucher.value} Credits added` : `${voucher.planId?.toUpperCase()} activated`}`,
    data: {
      creditBalance: updatedUser?.creditBalance,
      role: updatedUser?.role,
      isPremium: updatedUser?.isPremium,
    },
  });
}

// -------------------------------------------------------------
// Admin Endpoints for Direct UPI Orders
// -------------------------------------------------------------

export async function listAdminPaymentOrders(req: Request, res: Response): Promise<void> {
  const { status, page = 1, limit = 50 } = req.query;
  const filter: any = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    PaymentOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    PaymentOrder.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      orders,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
}

export async function approvePaymentOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const order = await PaymentOrder.findById(id);

  if (!order) {
    res.status(404).json({ success: false, error: { message: 'Order not found' } });
    return;
  }

  if (order.status === 'completed') {
    res.status(400).json({ success: false, error: { message: 'Order is already completed' } });
    return;
  }

  order.status = 'completed';
  order.verifiedAt = new Date();
  await order.save();

  // Fulfill order
  if (order.orderType === 'subscription') {
    await fulfillSubscription(
      order.userId.toString(),
      order.itemId as SubscriptionPlanId,
      'razorpay',
      `ADMIN-APPROVED-${order.utrNumber || order.orderId}`
    );
  } else if (order.orderType === 'credits') {
    await fulfillCreditPurchase(
      order.userId.toString(),
      order.itemId,
      'razorpay',
      `ADMIN-APPROVED-${order.utrNumber || order.orderId}`
    );
  }

  res.status(200).json({
    success: true,
    message: `Order ${order.orderId} approved and benefits granted to user`,
    data: order,
  });
}

export async function rejectPaymentOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await PaymentOrder.findById(id);
  if (!order) {
    res.status(404).json({ success: false, error: { message: 'Order not found' } });
    return;
  }

  order.status = 'rejected';
  order.rejectionReason = reason || 'Invalid UTR or payment not received';
  await order.save();

  res.status(200).json({
    success: true,
    message: `Order ${order.orderId} marked as rejected`,
    data: order,
  });
}

export async function createAdminVoucher(req: Request, res: Response): Promise<void> {
  const { code, type, value, planId, maxUses, expiresAt } = req.body;

  if (!code || !type || !value) {
    res.status(400).json({ success: false, error: { message: 'code, type, and value are required' } });
    return;
  }

  const voucher = await Voucher.create({
    code: String(code).toUpperCase().trim(),
    type,
    value,
    planId,
    maxUses: maxUses || 1,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  });

  res.status(201).json({
    success: true,
    data: voucher,
  });
}
