import express from 'express';
import mongoose from 'mongoose';
import { Channel, Tag } from '../models/Channel';
import { Message } from '../models/Message';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = express.Router();

// Get all channels with optional tag filtering
router.get('/', async (req, res) => {
  try {
    const { tags } = req.query;

    let query = {};

    // If tags query parameter is provided, filter by tags
    if (tags && typeof tags === 'string') {
      const tagNames = tags.split(',').map(tag => tag.trim());

      // Find tag IDs that match the provided tag names (all lowercase, exact match)
      const matchingTags = await Tag.find({
        name: { $in: tagNames.map(name => name.toLowerCase()) }
      });

      const tagIds = matchingTags.map(tag => tag._id);

      // Filter channels that have ANY of the specified tags (OR logic)
      if (tagIds.length > 0) {
        query = { tags: { $in: tagIds } };
      }
    }

    const channels = await Channel.find(query)
      .populate('tags')
      .populate({ path: 'creator', select: 'username' });
    res.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ message: 'Error fetching channels' });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const channels = await Channel.find({ creator: req.user._id })
      .populate('tags')
      .populate({ path: 'creator', select: 'username' });
    res.json(channels);
  } catch (error) {
    console.error('Error fetching user channels:', error);
    res.status(500).json({ message: 'Error fetching user channels' });
  }
});

router.get('/participated', requireAuth, async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const participatedChannelIds = await Message.distinct('channel', {
      authorId: req.user._id,
    });

    if (!participatedChannelIds.length) {
      return res.json([]);
    }

    const channels = await Channel.find({
      _id: { $in: participatedChannelIds },
      creator: { $ne: req.user._id },
    })
      .populate('tags')
      .populate({ path: 'creator', select: 'username' });

    res.json(channels);
  } catch (error) {
    console.error('Error fetching participated channels:', error);
    res.status(500).json({ message: 'Error fetching participated channels' });
  }
});

// Get a single channel by ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid channel ID' });
    }

    const channel = await Channel.findById(req.params.id)
      .populate('tags')
      .populate({ path: 'creator', select: 'username' });

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    res.json(channel);
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ message: 'Error fetching channel' });
  }
});


// Create a new channel
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ message: 'Channel title is required' });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ message: 'Channel description is required' });
    }
    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ message: 'At least one tag is required' });
    }

    // Academic field colors to match frontend theme
    const academicColors: { [key: string]: string } = {
      biology: '#10b981',
      physics: '#fbbf24',
      mathematics: '#60a5fa',
      philosophy: '#a78bfa',
      psychology: '#7e22ce',
      literature: '#ec4899',
      chemistry: '#06b6d4',
      history: '#ef4444',
    };

    // Handle tags (always store and match in lowercase)
    const tagIds = [];
    for (const tagName of tags) {
      const lowerTagName = tagName.toLowerCase();
      // Try to find existing tag (always lowercase)
      let tag = await Tag.findOne({ name: lowerTagName });
      if (!tag) {
        // Use academic color if available, otherwise generate random color
        const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const color = academicColors[lowerTagName] || `#${randomHex}`;
        tag = await Tag.create({ name: lowerTagName, color });
      }
      tagIds.push(tag._id);
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const channel = await Channel.create({
      title: title.trim(),
      description: description.trim(),
      tags: tagIds,
      creator: req.user._id,
    });

    const populatedChannel = await Channel.findById(channel._id)
      .populate('tags')
      .populate({ path: 'creator', select: 'username' });
    res.status(201).json(populatedChannel);
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ message: 'Error creating channel' });
  }
});

// Get messages for a specific channel
router.get('/:id/messages', optionalAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid channel ID' });
    }

    const channelExists = await Channel.exists({ _id: req.params.id });
    if (!channelExists) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const { includeDrafts } = req.query;

    if (includeDrafts && includeDrafts !== 'true') {
      return res.status(400).json({ message: 'includeDrafts must be "true" when provided' });
    }

    if (includeDrafts === 'true' && !req.user?._id) {
      return res.status(401).json({ message: 'Authentication required to include drafts' });
    }

    const baseFilter = { channel: req.params.id };
    const messagesQuery = includeDrafts === 'true' && req.user?._id
      ? {
        $or: [
          { ...baseFilter, isDraft: false },
          { ...baseFilter, isDraft: true, authorId: req.user._id },
        ],
      }
      : { ...baseFilter, isDraft: false };

    const messages = await Message.find(messagesQuery)
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Post a new message to a specific channel
router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid channel ID' });
    }

    const { content, parentMessageId, isDraft } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    if (isDraft !== undefined && typeof isDraft !== 'boolean') {
      return res.status(400).json({ message: 'isDraft must be a boolean when provided' });
    }

    const channel = await Channel.findById(req.params.id);
    if (!channel) {
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

        if (parentMessage.channel.toString() !== channel._id.toString()) {
          return res.status(400).json({ message: 'Parent message belongs to a different channel' });
        }
      }
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const authorName = req.user.username;
    const message = await Message.create({
      channel: channel._id,
      parentMessage: parentMessage ? parentMessage._id : undefined,
      authorId: req.user._id,
      author: authorName,
      content: content.trim(),
      isDraft: Boolean(isDraft),
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Error creating message' });
  }
});


export const channelRouter = router;
