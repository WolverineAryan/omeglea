import mongoose, { Document, Schema } from 'mongoose';
import { UserRole, AccountStatus, AgeVerificationStatus } from '@omeglea/shared';

export interface IUserDocument extends Document {
  displayName: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  ageVerificationStatus: AgeVerificationStatus;
  dateOfBirth?: Date;
  emailVerified: boolean;
  emailVerifyToken?: string;
  emailVerifyExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  creditBalance: number;
  isPremium: boolean;
  premiumExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ['guest', 'free', 'premium', 'moderator', 'admin'],
      default: 'free',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'banned', 'pending_verification'],
      default: 'active',
      index: true,
    },
    ageVerificationStatus: {
      type: String,
      enum: ['unverified', 'verified_self_attested', 'verified_id'],
      default: 'verified_self_attested',
    },
    dateOfBirth: {
      type: Date,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifyToken: {
      type: String,
    },
    emailVerifyExpires: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    creditBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiresAt: {
      type: Date,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, accountStatus: 1 });
userSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUserDocument>('User', userSchema);
