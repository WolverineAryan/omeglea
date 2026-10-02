import { z } from 'zod';

export const checkoutSubscriptionSchema = z.object({
  planId: z.enum(['weekly', 'monthly', 'quarterly', 'pro', 'vip']),
  paymentMethod: z.string().default('mock_card'),
  gateway: z.enum(['stripe', 'razorpay', 'auto']).optional(),
});

export type CheckoutSubscriptionInput = z.infer<typeof checkoutSubscriptionSchema>;

export const checkoutCreditsSchema = z.object({
  packageId: z.string().min(1),
  paymentMethod: z.string().default('mock_upi'),
});

export type CheckoutCreditsInput = z.infer<typeof checkoutCreditsSchema>;
