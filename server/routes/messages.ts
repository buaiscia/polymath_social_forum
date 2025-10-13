import express from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/Message';
import { Channel } from '../models/Channel';

const router = express.Router();

// List messages, optionally filtered by channel
router.get('/', async (req, res) => {
  try {
    const { channelId } = req.query;

    const filter: Record<string, unknown> = {};

    if (channelId) {
      if (typeof channelId !== 'string' || !mongoose.Types.ObjectId.isValid(channelId)) {
        return res.status(400).json({ message: 'Invalid channel ID' });
      }
      filter.channel = channelId;
    }

    const messages = await Message.find(filter).sort({ createdAt: 1 });
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
router.post('/', async (req, res) => {
  try {
    const { channelId, author, content } = req.body;

    if (!channelId || typeof channelId !== 'string' || !mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: 'Valid channelId is required' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const channelExists = await Channel.exists({ _id: channelId });
    if (!channelExists) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const authorName = typeof author === 'string' && author.trim().length > 0
      ? author.trim()
      : undefined;

    const message = await Message.create({
      channel: channelId,
      author: authorName,
      content: content.trim(),
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Error creating message' });
  }
});

// Update a message
router.patch('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const updates: Record<string, unknown> = {};
    const { author, content } = req.body;

    if (author !== undefined) {
      if (typeof author !== 'string') {
        return res.status(400).json({ message: 'Author must be a string' });
      }
      updates.author = author.trim().length > 0 ? author.trim() : 'Anonymous';
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: 'Content must be a non-empty string' });
      }
      updates.content = content.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ message: 'Error updating message' });
  }
});

// Delete a message
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const result = await Message.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

export const messageRouter = router;
