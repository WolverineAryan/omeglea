import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { JWTPayload } from '@omeglea/shared';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired authentication token' },
      });
      return;
    }

    // Verify user is not suspended or banned
    const dbUser = await User.findById(payload.userId).select('accountStatus role').lean();
    if (!dbUser) {
      res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User account no longer exists' },
      });
      return;
    }

    if (dbUser.accountStatus === 'banned') {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_BANNED', message: 'Your account has been permanently suspended' },
      });
      return;
    }

    if (dbUser.accountStatus === 'suspended') {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account is temporarily suspended' },
      });
      return;
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: dbUser.role || payload.role,
    };

    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Authentication verification failed' },
    });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        req.user = payload;
      }
    }
    next();
  } catch {
    next();
  }
}
