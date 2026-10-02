import mongoose, { Document, Schema } from 'mongoose';

export interface IConnectionDocument extends Document {
  requesterId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const connectionSchema = new Schema<IConnectionDocument>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

connectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

export const Connection = mongoose.model<IConnectionDocument>('Connection', connectionSchema);
