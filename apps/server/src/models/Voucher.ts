import mongoose, { Document, Schema } from 'mongoose';

export interface IVoucherDocument extends Document {
  code: string;
  type: 'credits' | 'subscription';
  value: number; // credits count or duration in days
  planId?: string; // for subscription vouchers (e.g. 'weekly', 'pro', 'vip')
  maxUses: number;
  usedCount: number;
  usedBy: mongoose.Types.ObjectId[];
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VoucherSchema = new Schema<IVoucherDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['credits', 'subscription'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    planId: {
      type: String,
    },
    maxUses: {
      type: Number,
      default: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    usedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Voucher = mongoose.model<IVoucherDocument>('Voucher', VoucherSchema);
