import { describe, it, expect } from 'vitest';
import { renderWithRouter, screen } from '../test/utils';
import SideNav from './SideNav';
import type { AuthUser } from '../context/authTypes';

const mockAuthUser: AuthUser = {
  _id: 'user-1',
  email: 'guest@example.com',
  username: 'GuestUser',
};

describe('SideNav permissions', () => {
  it('hides channel creation actions for guests', () => {
    renderWithRouter(<SideNav />);

    expect(screen.getByRole('link', { name: /explore channels/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /create channel/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /my channels/i })).not.toBeInTheDocument();
  });

  it('shows channel creation actions for authenticated users', () => {
    renderWithRouter(<SideNav />, '/', { authUser: mockAuthUser, authToken: 'token' });

    expect(screen.getByRole('link', { name: /explore channels/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create channel/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /my channels/i })).toBeInTheDocument();
  });
});
