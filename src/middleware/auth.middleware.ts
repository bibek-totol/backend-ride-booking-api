import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import User, { IUser, Role } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role } | null;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing', status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyAccessToken(token);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid token', status: 401 });
    }

    // attach minimal user info to request
    req.user = { id: decoded.id, role: decoded.role };

    // ensure user exists and is allowed to act
    const user = await User.findById(decoded.id).select('blocked approved role');
    if (!user) return res.status(404).json({ message: 'User not found', status: 404 });
    if ((user as any).blocked) return res.status(403).json({ message: 'User is blocked', status: 403 });
    if ((user as any).role !== 'admin' && !(user as any).approved) {
      // non-admin users must be approved
      return res.status(403).json({ message: 'User not approved', status: 403 });
    }

    next();
  } catch (err: any) {
    return res.status(401).json({ message: err.message || 'Unauthorized', status: 401 });
  }
};

export const authorize = (allowedRoles: Role[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized', status: 401 });

    if (allowedRoles.length === 0) return next();

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden', status: 403 });
    }

    next();
  };
};

export default { authenticate, authorize };
