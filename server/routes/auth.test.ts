import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authRouter } from './auth';

const userMock = vi.hoisted(() => ({
  exists: vi.fn(),
  create: vi.fn(),
  findOne: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
  toSafeUser: vi.fn(),
}));

vi.mock('../models/User', () => ({
  User: userMock,
}));

const {
  exists: mockUserExists,
  create: mockUserCreate,
  findOne: mockUserFindOne,
} = userMock;

const tokenMock = vi.hoisted(() => ({
  attachAccessTokenCookie: vi.fn(),
  attachRefreshTokenCookie: vi.fn(),
  clearAccessTokenCookie: vi.fn(),
  clearRefreshTokenCookie: vi.fn(),
  ensureTokenSecretsConfigured: vi.fn(),
  generateAccessToken: () => 'access-token',
  generateRefreshToken: () => 'refresh-token',
  verifyRefreshToken: vi.fn(),
}));

vi.mock('../utils/tokens', () => tokenMock);

const {
  attachAccessTokenCookie: mockAttachAccessTokenCookie,
  attachRefreshTokenCookie: mockAttachRefreshTokenCookie,
} = tokenMock;

const passwordMock = vi.hoisted(() => ({
  hashPassword: vi.fn(async () => 'hashed'),
  isPasswordStrong: () => true,
  verifyPassword: vi.fn(async () => true),
}));

vi.mock('../utils/password', () => passwordMock);

vi.mock('../middleware/rateLimit', () => ({
  authRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

const resetMocks = () => {
  mockUserExists.mockReset();
  mockUserCreate.mockReset();
  mockUserFindOne.mockReset();
  mockAttachAccessTokenCookie.mockReset();
  mockAttachRefreshTokenCookie.mockReset();
};

describe('Auth username casing', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('rejects registration when username differs only by case', async () => {
    mockUserExists.mockResolvedValueOnce(null); // email check
    mockUserExists.mockImplementationOnce(async (query: { username: RegExp }) => {
      expect(query.username).toBeInstanceOf(RegExp);
      expect(query.username.test('Scholar')).toBe(true);
      expect(query.username.test('scholar')).toBe(true);
      return true;
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'new@example.com',
        username: 'Scholar',
        password: 'ValidPass123!',
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/username/i);
  });

  it('returns the stored casing when logging in with a different case', async () => {
    const storedUser = {
      _id: 'user-1',
      email: 'scholar@example.com',
      username: 'ScholarCase',
      passwordHash: 'hashed',
      tokenVersion: 0,
      toSafeUser() {
        return {
          _id: this._id,
          email: this.email,
          username: this.username,
        };
      },
    };

    mockUserFindOne.mockImplementation(async (query: { username: RegExp }) => {
      expect(query.username).toBeInstanceOf(RegExp);
      expect(query.username.test('scholarcase')).toBe(true);
      expect(query.username.test('SCHOLARCASE')).toBe(true);
      return storedUser;
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'SCHOLARCASE', password: 'ValidPass123!' });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      _id: 'user-1',
      email: 'scholar@example.com',
      username: 'ScholarCase',
    });
    expect(mockAttachAccessTokenCookie).toHaveBeenCalled();
    expect(mockAttachRefreshTokenCookie).toHaveBeenCalled();
  });
});
