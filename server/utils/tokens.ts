import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import type { SafeUser, UserDocument } from '../models/User';

interface BasePayload {
  sub: string;
  username: string;
  email: string;
  tokenVersion: number;
}

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not defined');
  }
  return secret;
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }
  return secret;
};

const toPayload = (user: SafeUser | UserDocument, tokenVersion: number): BasePayload => ({
  sub: user._id.toString(),
  username: user.username,
  email: user.email,
  tokenVersion,
});

export const generateAccessToken = (user: SafeUser | UserDocument, tokenVersion: number) =>
  jwt.sign(toPayload(user, tokenVersion), getAccessSecret(), { expiresIn: ACCESS_TOKEN_EXPIRES_IN });

export const generateRefreshToken = (user: SafeUser | UserDocument, tokenVersion: number) =>
  jwt.sign(toPayload(user, tokenVersion), getRefreshSecret(), { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, getAccessSecret()) as BasePayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, getRefreshSecret()) as BasePayload;

export const attachRefreshTokenCookie = (res: Response, token: string) => {
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // default 7 days
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeMs,
  });
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
  });
};

export const ensureTokenSecretsConfigured = () => {
  getAccessSecret();
  getRefreshSecret();
};
