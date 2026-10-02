import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentOrderDocument extends Document {
  orderId: string;
  userId: mongoose.Types.ObjectId;
  paymentMethod: 'upi' | 'crypto';
  orderType: 'subscription' | 'credits';
  itemId: string;
  itemName: string;
  amountINR: number;
  upiMerchantId?: string;
  utrNumber?: string;
  cryptoNetwork?: string;
  cryptoCurrency?: string;
  cryptoAmount?: number;
  cryptoAddress?: string;
  txHash?: string;
  status: 'pending' | 'completed' | 'rejected';
  rejectionReason?: string;
  adminNote?: string;
  userEmail?: string;
  userDisplayName?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentOrderSchema = new Schema<IPaymentOrderDocument>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'crypto'],
      default: 'upi',
      index: true,
    },
    orderType: {
      type: String,
      enum: ['subscription', 'credits'],
      required: true,
    },
    itemId: {
      type: String,
      required: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    amountINR: {
      type: Number,
      required: true,
    },
    upiMerchantId: {
      type: String,
    },
    utrNumber: {
      type: String,
      index: true,
      trim: true,
    },
    cryptoNetwork: {
      type: String,
      trim: true,
    },
    cryptoCurrency: {
      type: String,
      trim: true,
    },
    cryptoAmount: {
      type: Number,
    },
    cryptoAddress: {
      type: String,
      trim: true,
    },
    txHash: {
      type: String,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
    },
    adminNote: {
      type: String,
    },
    userEmail: {
      type: String,
    },
    userDisplayName: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentOrder = mongoose.model<IPaymentOrderDocument>('PaymentOrder', PaymentOrderSchema);
