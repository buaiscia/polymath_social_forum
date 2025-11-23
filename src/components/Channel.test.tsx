import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import axios from 'axios';
import { renderWithRouter } from '../test/utils';
import Channel from './Channel';

vi.mock('axios');

interface MockMessage {
  _id: string;
  channel: string;
  author?: string;
  content: string;
  createdAt: string;
}

const mockChannel = {
  _id: 'chan-1',
  title: 'Test Channel',
  description: 'Exploring advanced topics.',
  tags: [],
  createdAt: '2025-08-08T21:46:00.000Z',
};

const initialMessage: MockMessage = {
  _id: 'msg-1',
  channel: mockChannel._id,
  author: 'Scholar',
  content: 'Initial statement.',
  createdAt: '2025-08-08T21:50:00.000Z',
};

const renderChannel = () =>
  renderWithRouter(
    <Routes>
      <Route path="/channels/:id" element={<Channel />} />
    </Routes>,
    `/channels/${mockChannel._id}`,
  );

describe('Channel messaging flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockGet = (messages: MockMessage[] = []) => {
    vi.mocked(axios.get).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/channels/')) {
        return Promise.resolve({ data: mockChannel });
      }
      if (typeof url === 'string' && url.includes('/api/messages')) {
        return Promise.resolve({ data: messages });
      }
      return Promise.resolve({ data: [] });
    });
  };

  it('disables the send button while the message input is empty', async () => {
    mockGet();
    vi.mocked(axios.post).mockResolvedValue({ data: null });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Conversation')).toBeInTheDocument();
    });

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  it('submits a message and appends it to the thread', async () => {
    mockGet([initialMessage]);
    const responseMessage = {
      _id: 'msg-2',
      channel: mockChannel._id,
      author: 'Ada',
      content: 'Sharing a new idea.',
      createdAt: '2025-08-08T22:00:00.000Z',
    };

    vi.mocked(axios.post).mockResolvedValue({ data: responseMessage });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Conversation')).toBeInTheDocument();
      expect(screen.getAllByTestId('conversation-message')).toHaveLength(1);
    });

    fireEvent.change(screen.getByPlaceholderText(/your name/i), {
      target: { value: 'Ada' },
    });
    fireEvent.change(screen.getByPlaceholderText(/share your thoughts/i), {
      target: { value: 'Sharing a new idea.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/messages',
        {
          channelId: mockChannel._id,
          content: 'Sharing a new idea.',
          author: 'Ada',
        }
      );
      expect(screen.getAllByTestId('conversation-message')).toHaveLength(2);
      expect(screen.getByText('Initial statement.')).toBeInTheDocument();
      expect(screen.getByText('Sharing a new idea.')).toBeInTheDocument();
    });
  });

  it('clears the composer after a successful submission', async () => {
    mockGet();
    const responseMessage = {
      _id: 'msg-3',
      channel: mockChannel._id,
      author: undefined,
      content: 'Clearing test.',
      createdAt: '2025-08-08T22:05:00.000Z',
    };

    vi.mocked(axios.post).mockResolvedValue({ data: responseMessage });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Conversation')).toBeInTheDocument();
    });

    const messageInput = screen.getByPlaceholderText(/share your thoughts/i);
    fireEvent.change(messageInput, {
      target: { value: 'Clearing test.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(messageInput).toHaveValue('');
    });
  });

  it('shows an error message when submission fails', async () => {
    mockGet();
    vi.mocked(axios.post).mockRejectedValue(new Error('Network error'));

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Conversation')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/share your thoughts/i), {
      target: { value: 'This will fail.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Unable to send your message right now. Please try again.'),
      ).toBeInTheDocument();
    });
  });
});
