import express from 'express';
import { Tag } from '../models/Channel';

const router = express.Router();

// Get all tags
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch {
    res.status(500).json({ message: 'Error fetching tags' });
  }
});

export const tagRouter = router;
