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

// Delete tag by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTag = await Tag.findByIdAndDelete(id);

    if (!deletedTag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json({ message: 'Tag deleted successfully', tag: deletedTag });
  } catch {
    res.status(500).json({ message: 'Error deleting tag' });
  }
});

export const tagRouter = router;
