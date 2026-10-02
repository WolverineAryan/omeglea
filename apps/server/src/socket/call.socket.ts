import { Server, Socket } from 'socket.io';
import { ChatSession } from '../models/ChatSession.js';
import { logger } from '../utils/logger.js';

export function registerCallHandlers(io: Server, socket: Socket): void {
  const userId = socket.data.userId as string;

  // Security Helper: verify socket is currently joined in this session room
  const isAuthorizedInSession = (sessionId: string): boolean => {
    return socket.rooms.has(sessionId);
  };

  // WebRTC Offer Relay
  socket.on('call:offer', (data: { sessionId: string; sdp: any }) => {
    if (!data?.sessionId || !data?.sdp || !isAuthorizedInSession(data.sessionId)) return;
    socket.to(data.sessionId).emit('call:offer', {
      sessionId: data.sessionId,
      sdp: data.sdp,
    });
  });

  // WebRTC Answer Relay
  socket.on('call:answer', (data: { sessionId: string; sdp: any }) => {
    if (!data?.sessionId || !data?.sdp || !isAuthorizedInSession(data.sessionId)) return;
    socket.to(data.sessionId).emit('call:answer', {
      sessionId: data.sessionId,
      sdp: data.sdp,
    });
  });

  // ICE Candidate Relay
  socket.on('call:ice-candidate', (data: { sessionId: string; candidate: any }) => {
    if (!data?.sessionId || !data?.candidate || !isAuthorizedInSession(data.sessionId)) return;
    socket.to(data.sessionId).emit('call:ice-candidate', {
      sessionId: data.sessionId,
      candidate: data.candidate,
    });
  });

  // End Call
  socket.on('call:end', async (data: { sessionId: string; reason?: string }) => {
    if (!data?.sessionId || !isAuthorizedInSession(data.sessionId)) return;
    const reason = data.reason || 'user_ended';

    // Broadcast to room that call has ended
    socket.to(data.sessionId).emit('call:ended', {
      sessionId: data.sessionId,
      reason,
    });

    // Update MongoDB ChatSession record
    try {
      await ChatSession.findOneAndUpdate(
        { sessionId: data.sessionId, status: 'active' },
        {
          $set: {
            status: 'ended',
            endedAt: new Date(),
            terminationReason: reason,
          },
        }
      );
    } catch (err: any) {
      logger.error('Error updating ended ChatSession in DB:', err.message);
    }

    // Leave the socket room
    socket.leave(data.sessionId);
  });
}
