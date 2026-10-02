import mongoose, { Document, Schema } from 'mongoose';

export interface IAdvertisementDocument extends Document {
  name: string;
  provider: string;
  placement: 'landing_banner' | 'dashboard_banner' | 'discover_banner' | 'interstitial_chat';
  enabled: boolean;
  targetPage: string;
  premiumExclude: boolean;
  displayFrequency: number;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const advertisementSchema = new Schema<IAdvertisementDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      default: 'custom_house_ad',
    },
    placement: {
      type: String,
      enum: ['landing_banner', 'dashboard_banner', 'discover_banner', 'interstitial_chat'],
      required: true,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    targetPage: {
      type: String,
      default: '/',
    },
    premiumExclude: {
      type: Boolean,
      default: true,
    },
    displayFrequency: {
      type: Number,
      default: 1,
    },
    config: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Advertisement = mongoose.model<IAdvertisementDocument>('Advertisement', advertisementSchema);
