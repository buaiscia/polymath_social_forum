import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
  parentMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  author: { type: String, default: 'Anonymous' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

messageSchema.index({ channel: 1, parentMessage: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
