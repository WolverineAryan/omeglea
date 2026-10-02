import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { JWTPayload } from '@omeglea/shared';

export function signAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

export function signRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: '30d',
  });
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as { userId: string };
  } catch (err) {
    return null;
  }
}
