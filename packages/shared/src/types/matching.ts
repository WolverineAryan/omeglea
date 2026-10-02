export type MatchingMode = 'random' | 'interests' | 'language' | 'country';

export interface MatchingPreferences {
  mode: MatchingMode;
  interests?: string[];
  preferredLanguages?: string[];
  preferredCountry?: string;
}

export interface MatchingQueueEntry {
  userId: string;
  socketId: string;
  preferences: MatchingPreferences;
  isPremium: boolean;
  joinedAt: number;
}

export interface MatchFoundPayload {
  sessionId: string;
  peerId: string;
  peerDisplayName: string;
  peerAvatar?: string;
  peerInterests?: string[];
  peerCountry?: string;
  sessionType: 'random' | 'private';
  initiator: boolean;
}
