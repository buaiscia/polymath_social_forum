import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/tokens';
import { User } from '../models/User';

const getTokenFromHeader = (req: Request) => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, value] = header.split(' ');
  if (scheme !== 'Bearer' || !value) return null;
  return value;
};

const getTokenFromCookies = (req: Request) => {
  const token = req.cookies?.accessToken;
  if (!token || typeof token !== 'string') {
    return null;
  }
  return token;
};

const getTokenFromRequest = (req: Request) => {
  return getTokenFromCookies(req) ?? getTokenFromHeader(req);
};

const attachUserFromToken = async (token: string, req: Request) => {
  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub);
  if (!user) {
    throw new Error('User not found');
  }
  if (user.tokenVersion !== payload.tokenVersion) {
    throw new Error('Token is no longer valid');
  }
  req.user = user.toSafeUser();
  req.tokenVersion = user.tokenVersion;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    await attachUserFromToken(token, req);
    return next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const token = getTokenFromRequest(req);
  if (!token) return next();

  try {
    await attachUserFromToken(token, req);
  } catch (error) {
    console.warn('Optional auth failed:', error);
  }
  return next();
};
