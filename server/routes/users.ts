import express from 'express';
import { User } from '../models/User';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const users = await User.find({}, { username: 1, email: 1 }).sort({ username: 1 });
    res.json(users.map((user) => ({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    })));
  } catch (error) {
    console.error('Error fetching users directory:', error);
    res.status(500).json({ message: 'Error fetching users directory' });
  }
});

export const userRouter = router;
