import express from 'express';
import type { Response } from 'express';
import validator from 'validator';
import { User } from '../models/User';
import { hashPassword, isPasswordStrong, verifyPassword } from '../utils/password';
import {
  attachAccessTokenCookie,
  attachRefreshTokenCookie,
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  ensureTokenSecretsConfigured,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/tokens';
import { requireAuth } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';

const router = express.Router();

const normaliseEmail = (email: string) => email.trim().toLowerCase();
const normaliseUsername = (username: string) => username.trim();
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildUsernamePattern = (username: string) => new RegExp(`^${escapeRegex(username)}$`, 'i');
const getErrorDetails = (error: unknown) => (error instanceof Error ? error.message : 'Unknown error');

const sendAuthResponse = (res: Response, user: InstanceType<typeof User>, status = 200) => {
  const safeUser = user.toSafeUser();
  const accessToken = generateAccessToken(user, user.tokenVersion);
  const refreshToken = generateRefreshToken(user, user.tokenVersion);
  attachAccessTokenCookie(res, accessToken);
  attachRefreshTokenCookie(res, refreshToken);
  return res.status(status).json({ user: safeUser });
};

router.post('/register', authRateLimiter, async (req, res) => {
  let createdUserId: string | null = null;
  try {
    const { email, username, password } = req.body;

    if (!email || typeof email !== 'string' || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'A valid email is required.' });
    }

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    }

    if (!password || typeof password !== 'string' || !isPasswordStrong(password)) {
      return res.status(400).json({
        message: 'Password must be 8+ chars with upper, lower, number, and symbol.',
      });
    }

    const emailValue = normaliseEmail(email);
    const usernameValue = normaliseUsername(username);
    const usernamePattern = buildUsernamePattern(usernameValue);

    const existingEmail = await User.exists({ email: emailValue });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    const existingUsername = await User.exists({ username: usernamePattern });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username already in use.' });
    }

    ensureTokenSecretsConfigured();

    const passwordHash = await hashPassword(password);
    const user = await User.create({ email: emailValue, username: usernameValue, passwordHash });
    createdUserId = user._id.toString();

    return sendAuthResponse(res, user, 201);
  } catch (error) {
    console.error('Registration error:', error);
    if (createdUserId) {
      try {
        await User.findByIdAndDelete(createdUserId);
      } catch (cleanupError) {
        console.error('Failed to rollback user creation:', cleanupError);
      }
    }
    const errorResponse: { message: string; details?: string } = { message: 'Unable to register at this time.' };
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.details = getErrorDetails(error);
    }
    return res.status(500).json(errorResponse);
  }
});

router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ message: 'Email or username is required.' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required.' });
    }

    const search = validator.isEmail(identifier)
      ? { email: normaliseEmail(identifier) }
      : { username: buildUsernamePattern(normaliseUsername(identifier)) };

    const user = await User.findOne(search);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    return sendAuthResponse(res, user);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Unable to login at this time.' });
  }
});

router.post('/refresh', authRateLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(401).json({ message: 'Refresh token missing.' });
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ message: 'Token revoked.' });
    }

    return sendAuthResponse(res, user);
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(401).json({ message: 'Unable to refresh session.' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.cookies ?? {};
    if (refreshToken && typeof refreshToken === 'string') {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await User.findByIdAndUpdate(payload.sub, { $inc: { tokenVersion: 1 } });
      } catch (tokenError) {
        console.warn('Failed to revoke refresh token during logout:', tokenError);
      }
    }
    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);
    return res.status(204).send();
  } catch (error) {
    console.error('Logout error:', error);
    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);
    return res.status(500).json({ message: 'Unable to logout at this time.' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  return res.json({ user: req.user });
});

export const authRouter = router;
