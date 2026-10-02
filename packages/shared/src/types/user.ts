export interface IUserProfile {
  userId: string;
  avatar?: string;
  biography?: string;
  interests: string[];
  languages: string[];
  country?: string;
  gender?: string;
  age?: number;
  photos?: string[];
  discoveryEnabled: boolean;
  visibilitySettings: {
    showCountry: boolean;
    showGender: boolean;
    showInterests: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PublicUserProfile {
  id: string;
  displayName: string;
  avatar?: string;
  biography?: string;
  interests: string[];
  languages: string[];
  country?: string;
  gender?: string;
  age?: number;
  photos?: string[];
  isPremium: boolean;
  role: string;
  lastActiveAt: string;
}

export interface ConnectionRequest {
  id: string;
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'rejected';
  requesterProfile?: PublicUserProfile;
  recipientProfile?: PublicUserProfile;
  createdAt: string;
  updatedAt: string;
}
