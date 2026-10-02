import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageDocument extends Document {
  sessionId: string;
  senderId: mongoose.Types.ObjectId;
  senderDisplayName: string;
  content: string;
  isSystem: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<IMessageDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderDisplayName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

messageSchema.index({ sessionId: 1, createdAt: 1 });
// TTL index: automatically remove messages older than 7 days to preserve free storage
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const Message = mongoose.model<IMessageDocument>('Message', messageSchema);
