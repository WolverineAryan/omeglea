import mongoose, { Document, Schema } from 'mongoose';
import { ReportCategory, ReportStatus } from '@omeglea/shared';

export interface IReportDocument extends Document {
  reporterId: mongoose.Types.ObjectId;
  reportedUserId: mongoose.Types.ObjectId;
  sessionId?: string;
  category: ReportCategory;
  description?: string;
  status: ReportStatus;
  moderatorId?: mongoose.Types.ObjectId;
  moderatorNotes?: string;
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

const reportSchema = new Schema<IReportDocument>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'inappropriate_behavior',
        'harassment',
        'suspected_underage',
        'spam',
        'scam',
        'impersonation',
        'explicit_content',
        'other',
      ],
      required: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'rejected'],
      default: 'pending',
      index: true,
    },
    moderatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatorNotes: {
      type: String,
      maxlength: 500,
    },
    resolution: {
      type: String,
      maxlength: 500,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

reportSchema.index({ reportedUserId: 1, status: 1 });
reportSchema.index({ createdAt: -1 });

export const Report = mongoose.model<IReportDocument>('Report', reportSchema);
