import { Request, Response } from 'express';
import { matchmakingService } from '../services/matchmaking.service.js';
import { env } from '../config/env.js';

export async function getMatchingStatus(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    data: {
      queueSize: matchmakingService.getQueueSize(),
      stunServer: env.STUN_SERVER,
      turnConfig: env.TURN_SERVER
        ? {
            urls: env.TURN_SERVER,
            username: env.TURN_USERNAME,
            credential: env.TURN_CREDENTIAL,
          }
        : null,
    },
  });
}
