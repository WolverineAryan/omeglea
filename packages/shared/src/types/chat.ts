export interface IChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderDisplayName: string;
  content: string;
  createdAt: string;
  isSystem?: boolean;
}

export interface IChatSession {
  id: string;
  sessionId: string;
  participantIds: string[];
  sessionType: 'random' | 'private';
  status: 'active' | 'ended';
  startedAt: string;
  endedAt?: string;
  terminationReason?: 'user_ended' | 'disconnected' | 'skipped' | 'reported' | 'timeout';
}
