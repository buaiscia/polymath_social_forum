import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { channelRouter } from './routes/channels';
import { tagRouter } from './routes/tags';
import { messageRouter } from './routes/messages';
import { authRouter } from './routes/auth';
import { csrfProtection } from './middleware/csrf';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const isProduction = process.env.NODE_ENV === 'production';
let corsOrigin: string | undefined;
if (isProduction) {
  if (!process.env.CLIENT_ORIGIN) {
    throw new Error('CLIENT_ORIGIN environment variable must be set in production');
  }
  corsOrigin = process.env.CLIENT_ORIGIN;
} else {
  corsOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
}
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json());

const allowedOrigins = corsOrigin ? [corsOrigin] : [];
app.use(csrfProtection(allowedOrigins));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Routes
app.use('/api/channels', channelRouter);
app.use('/api/tags', tagRouter);
app.use('/api/messages', messageRouter);
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
