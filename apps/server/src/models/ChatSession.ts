import mongoose, { Document, Schema } from 'mongoose';

export interface IChatSessionDocument extends Document {
  sessionId: string;
  participantIds: mongoose.Types.ObjectId[];
  sessionType: 'random' | 'private';
  status: 'active' | 'ended';
  startedAt: Date;
  endedAt?: Date;
  terminationReason?: 'user_ended' | 'disconnected' | 'skipped' | 'reported' | 'timeout';
  createdAt: Date;
  updatedAt: Date;
}

const chatSessionSchema = new Schema<IChatSessionDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    participantIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    sessionType: {
      type: String,
      enum: ['random', 'private'],
      default: 'random',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    endedAt: {
      type: Date,
    },
    terminationReason: {
      type: String,
      enum: ['user_ended', 'disconnected', 'skipped', 'reported', 'timeout'],
    },
  },
  {
    timestamps: true,
  }
);

chatSessionSchema.index({ participantIds: 1, status: 1 });
// TTL index: automatically remove session records older than 30 days to stay within free Atlas limits
chatSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const ChatSession = mongoose.model<IChatSessionDocument>('ChatSession', chatSessionSchema);
