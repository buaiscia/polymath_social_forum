import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { messageRouter } from './messages';

const mockMessageFind = vi.hoisted(() => vi.fn());
const mockMessageFindById = vi.hoisted(() => vi.fn());
const mockMessageCreate = vi.hoisted(() => vi.fn());
const mockMessageDeleteOne = vi.hoisted(() => vi.fn());
const mockMessageUpdateMany = vi.hoisted(() => vi.fn());

const mockChannelExists = vi.hoisted(() => vi.fn());

vi.mock('../models/Message', () => ({
  Message: {
    find: mockMessageFind,
    findById: mockMessageFindById,
    create: mockMessageCreate,
    deleteOne: mockMessageDeleteOne,
    updateMany: mockMessageUpdateMany,
  },
}));

vi.mock('../models/Channel', () => ({
  Channel: {
    exists: mockChannelExists,
  },
}));

vi.mock('../middleware/auth', () => ({
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = {
      _id: 'user-1',
      username: 'TestUser',
      email: 'test@example.com',
    };
    next();
  },
  optionalAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const headerUser = req.headers['x-test-user'];
    if (typeof headerUser === 'string') {
      req.user = {
        _id: headerUser,
        username: 'OptionalUser',
        email: 'opt@example.com',
      };
    }
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/messages', messageRouter);

const validChannelId = '64b64b64b64b64b64b64b64b';
const validMessageId = '74b74b74b74b74b74b74b74b';

const createSortResult = <T>(data: T[]) => ({
  sort: vi.fn().mockResolvedValue(data),
});

type MessageDoc = Record<string, unknown> & {
  _id: string;
  authorId: { toString(): string };
  author: string;
  channel: string;
  content: string;
  createdAt: Date;
  isDraft: boolean;
  isOrphaned: boolean;
  __v: number;
  markModified: ReturnType<typeof vi.fn>;
  set: (path: string, value: unknown) => void;
  save: ReturnType<typeof vi.fn>;
};

const buildMessageDoc = (overrides: Record<string, unknown> = {}) => {
  const markModified = vi.fn();
  let doc: MessageDoc;

  const set: MessageDoc['set'] = (path, value) => {
    (doc as Record<string, unknown>)[path] = value;
  };

  doc = {
    _id: validMessageId,
    authorId: { toString: () => 'user-1' },
    author: 'TestUser',
    channel: validChannelId,
    content: 'Original content',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    isDraft: true,
    isOrphaned: false,
    __v: 0,
    markModified,
    set,
    save: vi.fn(),
    ...overrides,
  };
  doc.save = vi.fn().mockResolvedValue(doc);
  return doc;
};

describe('Message drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates draft messages when isDraft is true', async () => {
    mockChannelExists.mockResolvedValue(true);
    const createdMessage = {
      _id: validMessageId,
      channel: validChannelId,
      content: 'Draft body',
      isDraft: true,
      authorId: 'user-1',
      author: 'TestUser',
      __v: 0,
    };
    mockMessageCreate.mockResolvedValue(createdMessage);

    const response = await request(app)
      .post('/messages')
      .send({ channelId: validChannelId, content: 'Draft body ', isDraft: true });

    expect(response.status).toBe(201);
    expect(response.body.isDraft).toBe(true);
    expect(mockMessageCreate).toHaveBeenCalledWith(expect.objectContaining({
      isDraft: true,
      content: 'Draft body',
    }));
  });

  it('sanitizes rich text content on create and update', async () => {
    mockChannelExists.mockResolvedValue(true);
    const sanitizedCreate = {
      _id: validMessageId,
      channel: validChannelId,
      content: '<p>Hello world</p>',
      isDraft: false,
      authorId: 'user-1',
      author: 'TestUser',
      __v: 0,
    };
    mockMessageCreate.mockResolvedValue(sanitizedCreate);

    const createResponse = await request(app)
      .post('/messages')
      .send({ channelId: validChannelId, content: '<p>Hello world</p><script>alert(1)</script>' });

    expect(createResponse.status).toBe(201);
    expect(mockMessageCreate).toHaveBeenCalledWith(expect.objectContaining({
      content: '<p>Hello world</p>',
    }));

    const draftMessage = buildMessageDoc();
    mockMessageFindById.mockResolvedValueOnce(draftMessage);

    const updateResponse = await request(app)
      .patch(`/messages/${validMessageId}`)
      .send({ content: '<ul><li>Safe</li><img src=x onerror=alert(1)></ul>' });

    expect(updateResponse.status).toBe(200);
    expect(draftMessage.content).toBe('<ul><li>Safe</li></ul>');
  });

  it('updates draft content without publishing', async () => {
    const draftMessage = buildMessageDoc();
    const originalVersion = draftMessage.__v;
    mockMessageFindById.mockResolvedValue(draftMessage);

    const response = await request(app)
      .patch(`/messages/${validMessageId}`)
      .send({ content: 'Updated draft text' });

    expect(response.status).toBe(200);
    expect(draftMessage.content).toBe('Updated draft text');
    expect(draftMessage.isDraft).toBe(true);
    expect(draftMessage.__v).toBe(originalVersion);
    expect(draftMessage.markModified).not.toHaveBeenCalledWith('createdAt');
    expect(draftMessage.save).toHaveBeenCalled();
  });

  it('publishes a draft and refreshes createdAt', async () => {
    const draftMessage = buildMessageDoc();
    const originalVersion = draftMessage.__v;
    const originalTimestamp = draftMessage.createdAt;
    mockMessageFindById.mockResolvedValue(draftMessage);

    const response = await request(app)
      .patch(`/messages/${validMessageId}`)
      .send({ publish: true });

    expect(response.status).toBe(200);
    expect(draftMessage.isDraft).toBe(false);
    expect(draftMessage.createdAt).not.toEqual(originalTimestamp);
    expect(draftMessage.markModified).toHaveBeenCalledWith('createdAt');
    expect(draftMessage.save).toHaveBeenCalled();
    expect(draftMessage.__v).toBe(originalVersion);
    expect(response.body.isDraft).toBe(false);
  });

  it('prevents publishing draft replies whose parent is orphaned or missing', async () => {
    const parentMessageId = '84b84b84b84b84b84b84b84b';
    const replyDraft = buildMessageDoc({ parentMessage: parentMessageId, isOrphaned: false });
    mockMessageFindById
      .mockResolvedValueOnce(replyDraft)
      .mockResolvedValueOnce({ _id: parentMessageId, isOrphaned: true });

    const response = await request(app)
      .patch(`/messages/${validMessageId}`)
      .send({ publish: true });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/orphaned/i);
    expect(replyDraft.isDraft).toBe(true);
    expect(mockMessageFindById).toHaveBeenNthCalledWith(2, parentMessageId);
  });

  it('rejects publishing drafts already marked orphaned without reloading parent', async () => {
    const parentMessageId = '94b94b94b94b94b94b94b94b';
    const replyDraft = buildMessageDoc({ parentMessage: parentMessageId, isOrphaned: true });
    mockMessageFindById.mockResolvedValueOnce(replyDraft);

    const response = await request(app)
      .patch(`/messages/${validMessageId}`)
      .send({ publish: true });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/orphaned/i);
    expect(mockMessageFindById).toHaveBeenCalledTimes(1);
  });

  it('increments the version only when editing published content', async () => {
    const publishedMessage = buildMessageDoc({ isDraft: false, __v: 5 });
    mockMessageFindById.mockResolvedValue(publishedMessage);

    const response = await request(app)
      .patch(`/messages/${validMessageId}`)
      .send({ content: 'Published content, now edited.' });

    expect(response.status).toBe(200);
    expect(publishedMessage.content).toBe('Published content, now edited.');
    expect(publishedMessage.__v).toBe(6);
  });

  it('includes own drafts when includeDrafts=true and user is provided', async () => {
    const published = { _id: 'pub-1', channel: validChannelId, isDraft: false };
    const myDraft = { _id: 'draft-1', channel: validChannelId, isDraft: true, authorId: 'user-1' };
    mockMessageFind.mockReturnValueOnce(createSortResult([published, myDraft]));

    const response = await request(app)
      .get('/messages')
      .set('x-test-user', 'user-1')
      .query({ includeDrafts: 'true', channelId: validChannelId });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(mockMessageFind).toHaveBeenCalledWith({
      $or: [
        expect.objectContaining({ channel: validChannelId, isDraft: false }),
        expect.objectContaining({ channel: validChannelId, isDraft: true, authorId: 'user-1' }),
      ],
    });
  });

  it('rejects includeDrafts when unauthenticated', async () => {
    const response = await request(app)
      .get('/messages')
      .query({ includeDrafts: 'true' });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/authentication required/i);
    expect(mockMessageFind).not.toHaveBeenCalled();
  });

  it('rejects replying to orphaned parent message', async () => {
    mockChannelExists.mockResolvedValue(true);
    const orphanedParentId = '84b84b84b84b84b84b84b84b';
    const orphanedParent = buildMessageDoc({ _id: orphanedParentId, isDraft: false, isOrphaned: true });
    mockMessageFindById.mockResolvedValueOnce(orphanedParent);

    const response = await request(app)
      .post('/messages')
      .send({ channelId: validChannelId, content: 'Hello', parentMessageId: orphanedParentId });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/orphaned/i);
    expect(mockMessageCreate).not.toHaveBeenCalled();
  });
});

describe('Message deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes own message and orphans its children', async () => {
    const ownedMessage = buildMessageDoc();
    mockMessageFindById.mockResolvedValueOnce(ownedMessage);
    mockMessageDeleteOne.mockResolvedValueOnce({ acknowledged: true, deletedCount: 1 });
    mockMessageUpdateMany.mockResolvedValueOnce({ acknowledged: true, modifiedCount: 2 });

    const response = await request(app)
      .delete(`/messages/${validMessageId}`);

    expect(response.status).toBe(200);
    expect(response.body.deletedId).toBe(validMessageId);
    expect(mockMessageDeleteOne).toHaveBeenCalledWith({ _id: validMessageId });
    expect(mockMessageUpdateMany).toHaveBeenCalledWith(
      { parentMessage: validMessageId },
      { isOrphaned: true },
    );
  });

  it('prevents deleting messages owned by others', async () => {
    const foreignMessage = buildMessageDoc({ authorId: { toString: () => 'other-user' } });
    mockMessageFindById.mockResolvedValueOnce(foreignMessage);

    const response = await request(app)
      .delete(`/messages/${validMessageId}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/own messages/i);
    expect(mockMessageDeleteOne).not.toHaveBeenCalled();
  });
});
