import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminAuditLogDocument extends Document {
  adminId: mongoose.Types.ObjectId;
  adminEmail: string;
  action: string;
  targetType: 'user' | 'report' | 'settings' | 'subscription';
  targetId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const adminAuditLogSchema = new Schema<IAdminAuditLogDocument>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'report', 'settings', 'subscription'],
      required: true,
    },
    targetId: {
      type: String,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

adminAuditLogSchema.index({ createdAt: -1 });

export const AdminAuditLog = mongoose.model<IAdminAuditLogDocument>(
  'AdminAuditLog',
  adminAuditLogSchema
);
