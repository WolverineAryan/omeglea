import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformSettingsDocument extends Document {
  freeDailyMatchLimit: number;
  premiumDailyMatchLimit: number;
  allowGuestMode: boolean;
  maintenanceMode: boolean;
  minAgeRequired: number;
  adPlacementSettings: {
    landingBanner: boolean;
    dashboardBanner: boolean;
    interstitialChat: boolean;
  };
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<IPlatformSettingsDocument>(
  {
    freeDailyMatchLimit: {
      type: Number,
      default: 50,
    },
    premiumDailyMatchLimit: {
      type: Number,
      default: 500,
    },
    allowGuestMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    minAgeRequired: {
      type: Number,
      default: 18,
    },
    adPlacementSettings: {
      landingBanner: { type: Boolean, default: true },
      dashboardBanner: { type: Boolean, default: true },
      interstitialChat: { type: Boolean, default: false },
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformSettings = mongoose.model<IPlatformSettingsDocument>(
  'PlatformSettings',
  platformSettingsSchema
);
