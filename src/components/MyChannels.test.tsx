import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import MyChannels from './MyChannels';
import { renderWithRouter, screen, waitFor } from '../test/utils';
import type { AuthUser } from '../context/authTypes';

vi.mock('axios');

const authenticatedUser: AuthUser = {
  _id: 'user-1',
  email: 'user@example.com',
  username: 'UserOne',
};

describe('MyChannels', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('prompts users to authenticate when no session is present', () => {
    renderWithRouter(<MyChannels />);

    expect(screen.getByText(/my channels/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows created channels for authenticated users', async () => {
    vi.mocked(axios.get).mockImplementation((url) => {
      if (url === '/channels/mine') {
        return Promise.resolve({
          data: [
            {
              _id: 'channel-1',
              title: 'Quantum Conversations',
              description: 'Discussing the latest in quantum research.',
              tags: [],
              creator: 'auth-1',
            },
          ],
        });
      }
      if (url === '/channels/participated') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/users') {
        return Promise.resolve({
          data: [
            {
              _id: 'auth-1',
              username: 'AuthUser',
              email: 'auth@example.com',
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderWithRouter(<MyChannels />, '/my-channels', {
      authUser: authenticatedUser,
      authToken: 'token',
    });

    await waitFor(() => {
      expect(screen.getByText('Quantum Conversations')).toBeInTheDocument();
    });

    expect(screen.getByText(/created channels/i)).toBeInTheDocument();
    expect(screen.getByText(/participated channels/i)).toBeInTheDocument();
  });
});
