import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { channelRouter } from './routes/channels';
import { tagRouter } from './routes/tags';
import { messageRouter } from './routes/messages';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Routes
app.use('/api/channels', channelRouter);
app.use('/api/tags', tagRouter);
app.use('/api/messages', messageRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
