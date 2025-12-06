import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { isAxiosError } from 'axios';
import MyChannels from './MyChannels';
import { renderWithRouter, screen, waitFor, fireEvent } from '../test/utils';
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
              creator: {
                _id: 'auth-1',
                username: 'AuthUser',
              },
            },
          ],
        });
      }
      if (url === '/channels/participated') {
        return Promise.resolve({ data: [] });
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

  it('renders an error state with retry action', async () => {
    vi.mocked(isAxiosError).mockReturnValue(true);
    vi.mocked(axios.get).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: { message: 'Server unavailable' },
      },
    });

    renderWithRouter(<MyChannels />, '/my-channels', {
      authUser: authenticatedUser,
      authToken: 'token',
    });

    await waitFor(() => {
      expect(screen.getByText('Server unavailable')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(4); // initial two + retry pair
    });
  });

  it('forces logout and returns to login prompt when session expires', async () => {
    vi.mocked(isAxiosError).mockReturnValue(true);
    vi.mocked(axios.get).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 401,
        data: { message: 'Invalid or expired token' },
      },
    });
    vi.mocked(axios.post).mockResolvedValue({ data: {} });

    renderWithRouter(<MyChannels />, '/my-channels', {
      authUser: authenticatedUser,
      authToken: 'token',
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/auth/logout');
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });
  });
});
