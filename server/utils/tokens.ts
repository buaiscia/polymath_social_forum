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
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '1d';

const parseExpiryToMs = (value: string, fallbackMs: number) => {
  const match = /^([0-9]+)([smhd])$/.exec(value.trim().toLowerCase());
  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (Number.isNaN(amount)) {
    return fallbackMs;
  }

  switch (unit) {
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    default:
      return fallbackMs;
  }
};

const accessTokenMaxAgeMs = parseExpiryToMs(ACCESS_TOKEN_EXPIRES_IN, 15 * 60 * 1000);
const refreshTokenMaxAgeMs = parseExpiryToMs(REFRESH_TOKEN_EXPIRES_IN, 24 * 60 * 60 * 1000);
const secureCookie = process.env.NODE_ENV === 'production';
const sameSitePolicy: 'strict' | 'lax' = 'lax';

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

export const attachAccessTokenCookie = (res: Response, token: string) => {
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: sameSitePolicy,
    maxAge: accessTokenMaxAgeMs,
  });
};

export const clearAccessTokenCookie = (res: Response) => {
  res.cookie('accessToken', '', {
    httpOnly: true,
    secure: secureCookie,
    sameSite: sameSitePolicy,
    expires: new Date(0),
  });
};

export const attachRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: sameSitePolicy,
    maxAge: refreshTokenMaxAgeMs,
  });
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: secureCookie,
    sameSite: sameSitePolicy,
    expires: new Date(0),
  });
};

export const ensureTokenSecretsConfigured = () => {
  getAccessSecret();
  getRefreshSecret();
};
