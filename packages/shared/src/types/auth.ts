export type UserRole = 'guest' | 'free' | 'premium' | 'vip' | 'moderator' | 'admin';

export type AccountStatus = 'active' | 'suspended' | 'banned' | 'pending_verification';

export type AgeVerificationStatus = 'unverified' | 'verified_self_attested' | 'verified_id';

export interface IUser {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  tier?: 'free' | 'pro' | 'vip';
  accountStatus: AccountStatus;
  ageVerificationStatus: AgeVerificationStatus;
  dateOfBirth?: string;
  emailVerified: boolean;
  creditBalance: number;
  dailyCallsUsed: number;
  dailyCallsLimit: number;
  lastCallDate?: string;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponse {
  user: IUser;
  tokens: AuthTokens;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
