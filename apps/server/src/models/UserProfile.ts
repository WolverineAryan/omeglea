import mongoose, { Document, Schema } from 'mongoose';

export interface IUserProfileDocument extends Document {
  userId: mongoose.Types.ObjectId;
  avatar?: string;
  biography?: string;
  interests: string[];
  languages: string[];
  country?: string;
  gender?: string;
  discoveryEnabled: boolean;
  visibilitySettings: {
    showCountry: boolean;
    showGender: boolean;
    showInterests: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userProfileSchema = new Schema<IUserProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    biography: {
      type: String,
      maxlength: 300,
      default: '',
    },
    interests: {
      type: [String],
      default: [],
      index: true,
    },
    languages: {
      type: [String],
      default: ['English'],
      index: true,
    },
    country: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      default: '',
    },
    discoveryEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    visibilitySettings: {
      showCountry: { type: Boolean, default: true },
      showGender: { type: Boolean, default: true },
      showInterests: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

userProfileSchema.index({ discoveryEnabled: 1, interests: 1 });

export const UserProfile = mongoose.model<IUserProfileDocument>('UserProfile', userProfileSchema);
