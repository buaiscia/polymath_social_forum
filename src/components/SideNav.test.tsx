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

describe('SideNav highlighting', () => {
  it('marks Explore Channels active on root and channel views', () => {
    renderWithRouter(<SideNav />, '/channels/alpha', { authUser: mockAuthUser, authToken: 'token' });

    expect(screen.getByRole('link', { name: /explore channels/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /create channel/i })).not.toHaveAttribute('aria-current');
  });

  it('marks Create Channel active on the creation route', () => {
    renderWithRouter(<SideNav />, '/create', { authUser: mockAuthUser, authToken: 'token' });

    expect(screen.getByRole('link', { name: /create channel/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /explore channels/i })).not.toHaveAttribute('aria-current');
  });

  it('marks My Channels active on the dashboard route', () => {
    renderWithRouter(<SideNav />, '/my-channels', { authUser: mockAuthUser, authToken: 'token' });

    expect(screen.getByRole('link', { name: /my channels/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /explore channels/i })).not.toHaveAttribute('aria-current');
  });
});
