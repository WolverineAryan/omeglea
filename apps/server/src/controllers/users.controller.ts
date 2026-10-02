import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { UserProfile } from '../models/UserProfile.js';
import { UpdateProfileInput, PublicUserProfile } from '@omeglea/shared';
import { formatUserResponse } from './auth.controller.js';

export async function getMyProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const [user, profile] = await Promise.all([
    User.findById(userId),
    UserProfile.findOne({ userId }),
  ]);

  if (!user) {
    res.status(404).json({ success: false, error: { message: 'User not found' } });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      user: formatUserResponse(user),
      profile,
    },
  });
}

export async function updateMyProfile(
  req: Request<{}, {}, UpdateProfileInput>,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;
  const {
    displayName,
    avatar,
    biography,
    interests,
    languages,
    country,
    gender,
    age,
    photos,
    discoveryEnabled,
    visibilitySettings,
  } = req.body;

  if (displayName) {
    await User.findByIdAndUpdate(userId, { displayName });
  }

  const profileUpdate: any = {};
  if (avatar !== undefined) profileUpdate.avatar = avatar;
  if (biography !== undefined) profileUpdate.biography = biography;
  if (interests !== undefined) profileUpdate.interests = interests;
  if (languages !== undefined) profileUpdate.languages = languages;
  if (country !== undefined) profileUpdate.country = country;
  if (gender !== undefined) profileUpdate.gender = gender;
  if (age !== undefined) profileUpdate.age = age;
  if (photos !== undefined) profileUpdate.photos = photos;
  if (discoveryEnabled !== undefined) profileUpdate.discoveryEnabled = discoveryEnabled;
  if (visibilitySettings !== undefined) profileUpdate.visibilitySettings = visibilitySettings;

  const updatedProfile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: profileUpdate },
    { new: true, upsert: true }
  );

  const updatedUser = await User.findById(userId);

  res.status(200).json({
    success: true,
    data: {
      user: formatUserResponse(updatedUser),
      profile: updatedProfile,
    },
  });
}

export async function getPublicProfile(req: Request, res: Response): Promise<void> {
  const targetId = req.params.id;
  const [user, profile] = await Promise.all([
    User.findById(targetId).select('displayName isPremium role lastActiveAt accountStatus createdAt').lean(),
    UserProfile.findOne({ userId: targetId }).lean(),
  ]);

  if (!user || user.accountStatus === 'banned') {
    res.status(404).json({ success: false, error: { message: 'Profile not found' } });
    return;
  }

  const publicProfile: PublicUserProfile = {
    id: user._id.toString(),
    displayName: user.displayName,
    avatar: profile?.avatar,
    biography: profile?.biography,
    interests: profile?.visibilitySettings?.showInterests !== false ? profile?.interests || [] : [],
    languages: profile?.languages || ['English'],
    country: profile?.visibilitySettings?.showCountry !== false ? profile?.country : undefined,
    gender: profile?.visibilitySettings?.showGender !== false ? profile?.gender : undefined,
    age: profile?.age,
    photos: profile?.photos || [],
    isPremium: Boolean(user.isPremium),
    role: user.role,
    lastActiveAt: user.lastActiveAt?.toISOString() || new Date().toISOString(),
  };

  res.status(200).json({
    success: true,
    data: publicProfile,
  });
}

export async function deleteMyAccount(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  // Soft delete / anonymize user data
  await User.findByIdAndUpdate(userId, {
    accountStatus: 'suspended',
    email: `deleted_${userId}@deleted.omeglea.com`,
    displayName: 'Deleted User',
    passwordHash: undefined,
  });

  await UserProfile.findOneAndUpdate(
    { userId },
    {
      biography: '',
      avatar: '',
      interests: [],
      discoveryEnabled: false,
    }
  );

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully',
  });
}
