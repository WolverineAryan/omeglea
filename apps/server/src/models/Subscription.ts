import mongoose, { Document, Schema } from 'mongoose';
import { SubscriptionPlanId, SubscriptionStatus } from '@omeglea/shared';

export interface ISubscriptionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  startedAt: Date;
  expiresAt: Date;
  paymentProvider: 'mock' | 'razorpay' | 'stripe';
  externalSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'expired', 'cancelled', 'failed'],
      default: 'active',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    paymentProvider: {
      type: String,
      enum: ['mock', 'razorpay', 'stripe'],
      default: 'mock',
    },
    externalSubscriptionId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ userId: 1, status: 1 });

export const Subscription = mongoose.model<ISubscriptionDocument>('Subscription', subscriptionSchema);
