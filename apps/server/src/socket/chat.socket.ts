import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { sanitizeHtml, sanitizeText } from '../utils/sanitize.js';
import { IChatMessage } from '@omeglea/shared';
import { logger } from '../utils/logger.js';

const lastMessageTimestamps: Map<string, number> = new Map();

export function registerChatHandlers(io: Server, socket: Socket): void {
  const userId = socket.data.userId as string;

  // Security Helper: verify socket is currently joined in this session room
  const isAuthorizedInSession = (sessionId: string): boolean => {
    return socket.rooms.has(sessionId);
  };

  // Real-time Chat Message
  socket.on('chat:message', async (data: { sessionId: string; content: string }) => {
    try {
      if (!data?.sessionId || !data?.content || !isAuthorizedInSession(data.sessionId)) return;

      // Rate limit messages per socket (max 1 msg per 300ms)
      const now = Date.now();
      const lastMsgTime = lastMessageTimestamps.get(socket.id) || 0;
      if (now - lastMsgTime < 300) {
        socket.emit('error', {
          code: 'RATE_LIMITED',
          message: 'Please wait before sending another message',
        });
        return;
      }
      lastMessageTimestamps.set(socket.id, now);

      const cleanContent = sanitizeHtml(sanitizeText(data.content)).slice(0, 1000);
      if (!cleanContent) return;

      const userDoc = await User.findById(userId).select('displayName').lean();
      const displayName = userDoc?.displayName || 'User';

      const messageObj: IChatMessage = {
        id: uuidv4(),
        sessionId: data.sessionId,
        senderId: userId,
        senderDisplayName: displayName,
        content: cleanContent,
        createdAt: new Date().toISOString(),
      };

      // Broadcast to all members of the session room
      io.to(data.sessionId).emit('chat:message', messageObj);

      // Persist to MongoDB
      await Message.create({
        sessionId: data.sessionId,
        senderId: userId,
        senderDisplayName: displayName,
        content: cleanContent,
        isSystem: false,
      });
    } catch (err: any) {
      logger.error('Error handling chat:message socket event:', err.message);
    }
  });

  // Typing Indicator Relay
  socket.on('user:typing', (data: { sessionId: string; isTyping: boolean }) => {
    if (!data?.sessionId || !isAuthorizedInSession(data.sessionId)) return;
    socket.to(data.sessionId).emit('user:typing', {
      senderId: userId,
      isTyping: Boolean(data.isTyping),
    });
  });
}
