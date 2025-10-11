import express from 'express';
import { Channel, Tag } from '../models/Channel';

const router = express.Router();

// Get all channels with optional tag filtering
router.get('/', async (req, res) => {
  try {
    const { tags } = req.query;

    let query = {};

    // If tags query parameter is provided, filter by tags
    if (tags && typeof tags === 'string') {
      const tagNames = tags.split(',').map(tag => tag.trim());

      // Find tag IDs that match the provided tag names (case-insensitive)
      const matchingTags = await Tag.find({
        name: {
          $in: tagNames.map(name => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'))
        }
      });

      const tagIds = matchingTags.map(tag => tag._id);

      // Filter channels that have ANY of the specified tags (OR logic)
      if (tagIds.length > 0) {
        query = { tags: { $in: tagIds } };
      }
    }

    const channels = await Channel.find(query).populate('tags');
    res.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ message: 'Error fetching channels' });
  }
});


// Create a new channel
router.post('/', async (req, res) => {
  try {
    const { title, description, tags } = req.body;

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

    // Handle tags
    const tagIds = [];
    for (const tagName of tags) {
      // Try to find existing tag or create new one
      let tag = await Tag.findOne({ name: tagName });
      if (!tag) {
        // Use academic color if available, otherwise generate random color
        const color = academicColors[tagName.toLowerCase()] || '#' + Math.floor(Math.random() * 16777215).toString(16);
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
    console.error('Error creating channel:', error);
    res.status(500).json({ message: 'Error creating channel' });
  }
});


export const channelRouter = router;
