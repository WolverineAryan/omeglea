import mongoose, { Document, Schema } from 'mongoose';

export interface IBlockedUserDocument extends Document {
  blockerId: mongoose.Types.ObjectId;
  blockedUserId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const blockedUserSchema = new Schema<IBlockedUserDocument>(
  {
    blockerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    blockedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

blockedUserSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

export const BlockedUser = mongoose.model<IBlockedUserDocument>('BlockedUser', blockedUserSchema);
