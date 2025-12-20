import express from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/Message';
import { Channel } from '../models/Channel';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { isRichTextEmpty, sanitizeRichText } from '../utils/sanitize';

const router = express.Router();

type VersionedDocument = mongoose.Document & {
  get?: (path: '__v') => number | undefined;
  set?: (path: string, value: unknown) => void;
  __v?: number;
};

const bumpDocumentVersion = (message: VersionedDocument) => {
  const currentVersion = typeof message.get === 'function'
    ? message.get('__v')
    : message.__v;
  const nextVersion = typeof currentVersion === 'number' ? currentVersion + 1 : 1;

  if (typeof message.set === 'function') {
    message.set('__v', nextVersion);
  } else {
    message.__v = nextVersion;
  }
};

// List messages, optionally filtered by channel
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { channelId, includeDrafts } = req.query;

    const filter: Record<string, unknown> = {};

    if (channelId) {
      if (typeof channelId !== 'string' || !mongoose.Types.ObjectId.isValid(channelId)) {
        return res.status(400).json({ message: 'Invalid channel ID' });
      }
      filter.channel = channelId;
    }

    if (includeDrafts && includeDrafts !== 'true') {
      return res.status(400).json({ message: 'includeDrafts must be "true" when provided' });
    }

    if (includeDrafts === 'true' && !req.user?._id) {
      return res.status(401).json({ message: 'Authentication required to include drafts' });
    }

    const messagesQuery = includeDrafts === 'true' && req.user?._id
      ? {
        $or: [
          { ...filter, isDraft: false },
          { ...filter, isDraft: true, authorId: req.user._id },
        ],
      }
      : { ...filter, isDraft: false };

    const messages = await Message.find(messagesQuery).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Get a single message
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ message: 'Error fetching message' });
  }
});

// Create a new message
router.post('/', requireAuth, async (req, res) => {
  try {
    const { channelId, content, parentMessageId, isDraft } = req.body;

    if (!channelId || typeof channelId !== 'string' || !mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: 'Valid channelId is required' });
    }

    if (!content || typeof content !== 'string' || isRichTextEmpty(content)) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    if (isDraft !== undefined && typeof isDraft !== 'boolean') {
      return res.status(400).json({ message: 'isDraft must be a boolean when provided' });
    }

    const channelExists = await Channel.exists({ _id: channelId });
    if (!channelExists) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    let parentMessage = null;
    if (parentMessageId !== undefined) {
      if (parentMessageId === null) {
        parentMessage = null;
      } else {
        if (typeof parentMessageId !== 'string' || !mongoose.Types.ObjectId.isValid(parentMessageId)) {
          return res.status(400).json({ message: 'Invalid parent message ID' });
        }

        parentMessage = await Message.findById(parentMessageId);
        if (!parentMessage) {
          return res.status(404).json({ message: 'Parent message not found' });
        }

        if (parentMessage.channel.toString() !== channelId) {
          return res.status(400).json({ message: 'Parent message belongs to a different channel' });
        }

        if (parentMessage.isOrphaned) {
          return res.status(400).json({ message: 'Cannot reply to an orphaned message' });
        }
      }
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const authorName = req.user.username;

    const message = await Message.create({
      channel: channelId,
      parentMessage: parentMessage ? parentMessage._id : undefined,
      authorId: req.user._id,
      author: authorName,
      content: sanitizeRichText(content),
      isDraft: Boolean(isDraft),
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Error creating message' });
  }
});

// Update or publish a message
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const { content, publish, isDraft } = req.body;

    if (content === undefined && publish === undefined && isDraft === undefined) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    if (content !== undefined && (typeof content !== 'string' || isRichTextEmpty(content))) {
      return res.status(400).json({ message: 'Content must be a non-empty string' });
    }

    if (publish !== undefined && typeof publish !== 'boolean') {
      return res.status(400).json({ message: 'publish must be a boolean when provided' });
    }

    if (isDraft !== undefined && typeof isDraft !== 'boolean') {
      return res.status(400).json({ message: 'isDraft must be a boolean when provided' });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!message.authorId || message.authorId.toString() !== String(req.user?._id)) {
      return res.status(403).json({ message: 'You can only update your own messages' });
    }

    const wasDraftBeforeUpdate = Boolean(message.isDraft);
    const shouldIncrementVersion = !wasDraftBeforeUpdate && content !== undefined;

    if (content !== undefined) {
      message.content = sanitizeRichText(content);
    }

    if (isDraft === true && !message.isDraft) {
      return res.status(400).json({ message: 'Published messages cannot be reverted to drafts' });
    }

    const shouldPublish = publish === true || (isDraft === false && message.isDraft);

    if (shouldPublish) {
      if (!message.isDraft) {
        return res.status(400).json({ message: 'Message is already published' });
      }

      if (message.isOrphaned) {
        return res.status(400).json({ message: 'Cannot publish a reply to an orphaned message' });
      }

      if (message.parentMessage) {
        const parentMessage = await Message.findById(message.parentMessage);
        if (!parentMessage || parentMessage.isOrphaned) {
          return res.status(400).json({ message: 'Cannot publish a reply to an orphaned message' });
        }
      }

      message.isDraft = false;
      const now = new Date();
      (message as typeof message & { createdAt: Date }).createdAt = now;
      message.markModified('createdAt');
    }

    if (shouldIncrementVersion) {
      bumpDocumentVersion(message as VersionedDocument);
    }
    await message.save();

    res.json(message);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ message: 'Error updating message' });
  }
});

// Delete a message
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!message.authorId || message.authorId.toString() !== String(req.user?._id)) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    await Message.deleteOne({ _id: message._id });
    await Message.updateMany(
      { parentMessage: message._id },
      { isOrphaned: true },
    );

    res.json({ deletedId: message._id.toString() });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

export const messageRouter = router;
