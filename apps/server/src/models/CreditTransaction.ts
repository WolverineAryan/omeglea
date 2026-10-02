import mongoose, { Document, Schema } from 'mongoose';

export interface ICreditTransactionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  transactionType: 'purchase' | 'spend' | 'refund' | 'bonus';
  creditAmount: number;
  paymentAmountINR?: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  externalPaymentId?: string;
  idempotencyKey?: string;
  createdAt: Date;
}

const creditTransactionSchema = new Schema<ICreditTransactionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    transactionType: {
      type: String,
      enum: ['purchase', 'spend', 'refund', 'bonus'],
      required: true,
    },
    creditAmount: {
      type: Number,
      required: true,
    },
    paymentAmountINR: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    externalPaymentId: {
      type: String,
      sparse: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

creditTransactionSchema.index({ userId: 1, createdAt: -1 });

export const CreditTransaction = mongoose.model<ICreditTransactionDocument>(
  'CreditTransaction',
  creditTransactionSchema
);
