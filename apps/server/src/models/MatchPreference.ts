import mongoose, { Document, Schema } from 'mongoose';
import { MatchingMode } from '@omeglea/shared';

export interface IMatchPreferenceDocument extends Document {
  userId: mongoose.Types.ObjectId;
  mode: MatchingMode;
  interests: string[];
  preferredLanguages: string[];
  preferredCountry?: string;
  createdAt: Date;
  updatedAt: Date;
}

const matchPreferenceSchema = new Schema<IMatchPreferenceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['random', 'interests', 'language', 'country'],
      default: 'random',
    },
    interests: {
      type: [String],
      default: [],
    },
    preferredLanguages: {
      type: [String],
      default: ['English'],
    },
    preferredCountry: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const MatchPreference = mongoose.model<IMatchPreferenceDocument>(
  'MatchPreference',
  matchPreferenceSchema
);
