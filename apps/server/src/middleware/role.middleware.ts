import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@omeglea/shared';

const roleHierarchy: Record<UserRole, number> = {
  guest: 0,
  free: 1,
  premium: 2,
  moderator: 3,
  admin: 4,
};

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const userRole = req.user.role as UserRole;
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
        },
      });
      return;
    }

    next();
  };
}

export function requireMinRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const userRole = req.user.role as UserRole;
    if ((roleHierarchy[userRole] ?? 0) < roleHierarchy[minRole]) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient privileges for this action',
        },
      });
      return;
    }

    next();
  };
}
