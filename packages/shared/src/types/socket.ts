import { MatchingPreferences, MatchFoundPayload } from './matching.js';
import { IChatMessage } from './chat.js';

export interface ServerToClientEvents {
  'matching:waiting': (data: { position?: number; estimatedWaitMs?: number }) => void;
  'matching:found': (data: MatchFoundPayload) => void;
  'matching:timeout': (data: { message: string }) => void;
  'matching:left': () => void;
  
  // WebRTC Signaling
  'call:offer': (data: { sessionId: string; sdp: any }) => void;
  'call:answer': (data: { sessionId: string; sdp: any }) => void;
  'call:ice-candidate': (data: { sessionId: string; candidate: any }) => void;
  'call:ended': (data: { sessionId: string; reason: string }) => void;
  
  // Real-time Chat
  'chat:message': (data: IChatMessage) => void;
  'user:typing': (data: { senderId: string; isTyping: boolean }) => void;
  
  // Notifications & Status
  'notification:new': (data: { id: string; type: string; title: string; message: string; data?: any; createdAt: string }) => void;
  'error': (data: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'matching:join': (data: { preferences: MatchingPreferences }) => void;
  'matching:leave': () => void;
  
  // WebRTC Signaling
  'call:offer': (data: { sessionId: string; sdp: any }) => void;
  'call:answer': (data: { sessionId: string; sdp: any }) => void;
  'call:ice-candidate': (data: { sessionId: string; candidate: any }) => void;
  'call:end': (data: { sessionId: string; reason?: string }) => void;
  
  // Real-time Chat
  'chat:message': (data: { sessionId: string; content: string }) => void;
  'user:typing': (data: { sessionId: string; isTyping: boolean }) => void;
  
  // Safety Actions
  'user:block': (data: { targetUserId: string; sessionId?: string }) => void;
}
