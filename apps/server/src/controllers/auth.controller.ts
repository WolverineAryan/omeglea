import { Request, Response } from 'express';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { UserProfile } from '../models/UserProfile.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput, IUser } from '@omeglea/shared';

export function formatUserResponse(userDoc: any): IUser {
  return {
    id: userDoc._id.toString(),
    displayName: userDoc.displayName,
    email: userDoc.email,
    role: userDoc.role,
    accountStatus: userDoc.accountStatus,
    ageVerificationStatus: userDoc.ageVerificationStatus,
    dateOfBirth: userDoc.dateOfBirth?.toISOString(),
    emailVerified: userDoc.emailVerified,
    creditBalance: userDoc.creditBalance || 0,
    isPremium: Boolean(userDoc.isPremium),
    createdAt: userDoc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: userDoc.updatedAt?.toISOString() || new Date().toISOString(),
    lastActiveAt: userDoc.lastActiveAt?.toISOString() || new Date().toISOString(),
  };
}

export async function register(req: Request<{}, {}, RegisterInput>, res: Response): Promise<void> {
  const { displayName, email, password, dateOfBirth } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(409).json({
      success: false,
      error: { code: 'EMAIL_IN_USE', message: 'An account with this email already exists' },
    });
    return;
  }

  const hashedPassword = await hashPassword(password);
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const newUser = await User.create({
    displayName,
    email: email.toLowerCase(),
    passwordHash: hashedPassword,
    role: 'free',
    accountStatus: 'active',
    ageVerificationStatus: 'verified_self_attested',
    dateOfBirth: new Date(dateOfBirth),
    emailVerified: false,
    emailVerifyToken: verifyToken,
    emailVerifyExpires: verifyExpires,
    creditBalance: 10, // 10 welcome credits
    isPremium: false,
  });

  // Create default profile
  await UserProfile.create({
    userId: newUser._id,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`,
    biography: `Hey there! I am new to Omeglea.`,
    interests: ['Chat', 'Music', 'Movies'],
    languages: ['English'],
    discoveryEnabled: true,
  });

  // Send verification email in background
  sendVerificationEmail(newUser.email, newUser.displayName, verifyToken).catch(() => {});

  const accessToken = signAccessToken({
    userId: newUser._id.toString(),
    email: newUser.email,
    role: newUser.role,
  });

  const refreshToken = signRefreshToken({ userId: newUser._id.toString() });

  res.status(201).json({
    success: true,
    data: {
      user: formatUserResponse(newUser),
      tokens: { accessToken, refreshToken },
    },
  });
}

export async function login(req: Request<{}, {}, LoginInput>, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.passwordHash) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
    return;
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
    return;
  }

  if (user.accountStatus === 'banned') {
    res.status(403).json({
      success: false,
      error: { code: 'ACCOUNT_BANNED', message: 'Your account has been permanently suspended' },
    });
    return;
  }

  // Update last active
  user.lastActiveAt = new Date();
  await user.save();

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  const refreshToken = signRefreshToken({ userId: user._id.toString() });

  res.status(200).json({
    success: true,
    data: {
      user: formatUserResponse(user),
      tokens: { accessToken, refreshToken },
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function forgotPassword(
  req: Request<{}, {}, ForgotPasswordInput>,
  res: Response
): Promise<void> {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    sendPasswordResetEmail(user.email, user.displayName, resetToken).catch(() => {});
  }

  // Always return success to prevent email enumeration
  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, password reset instructions have been sent.',
  });
}

export async function resetPassword(
  req: Request<{}, {}, ResetPasswordInput>,
  res: Response
): Promise<void> {
  const { token, password } = req.body;

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Password reset token is invalid or has expired' },
    });
    return;
  }

  user.passwordHash = await hashPassword(password);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully. You can now log in.',
  });
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const token = req.query.token as string;
  if (!token) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Verification token is required' },
    });
    return;
  }

  const user = await User.findOne({
    emailVerifyToken: token,
    emailVerifyExpires: { $gt: new Date() },
  });

  if (!user) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Email verification token is invalid or expired' },
    });
    return;
  }

  user.emailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully! You now have full access to Omeglea.',
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
    return;
  }

  const profile = await UserProfile.findOne({ userId: user._id });

  res.status(200).json({
    success: true,
    data: {
      user: formatUserResponse(user),
      profile: profile || null,
    },
  });
}
