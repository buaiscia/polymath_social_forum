import express from 'express';
import { Channel, Tag } from '../models/Channel';

const router = express.Router();

// Get all channels
router.get('/', async (req, res) => {
  try {
    const channels = await Channel.find().populate('tags');
    res.json(channels);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching channels' });
  }
});

// Create a new channel
router.post('/', async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    // Handle tags
    const tagIds = [];
    for (const tagName of tags) {
      // Try to find existing tag or create new one
      let tag = await Tag.findOne({ name: tagName });
      if (!tag) {
        // Generate a random color for new tag
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
        tag = await Tag.create({ name: tagName, color });
      }
      tagIds.push(tag._id);
    }

    const channel = await Channel.create({
      title,
      description,
      tags: tagIds,
    });

    const populatedChannel = await Channel.findById(channel._id).populate('tags');
    res.status(201).json(populatedChannel);
  } catch (error) {
    res.status(500).json({ message: 'Error creating channel' });
  }
});

// Get all tags
router.get('/tags', async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tags' });
  }
});

export const channelRouter = router;
