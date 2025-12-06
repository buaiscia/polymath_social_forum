import { describe, it, expect, beforeEach } from 'vitest';
import { renderWithRouter, screen } from '../test/utils';
import ChannelCard from './ChannelCard';
import type { AuthUser } from '../context/authTypes';

describe('ChannelCard', () => {
  const mockGetFieldColor = (field: string) => `academic.${field}`;

  const mockChannel = {
    id: '1',
    title: 'Quantum Physics Discussion',
    description: 'A forum for discussing quantum mechanics and related topics',
    tags: [
      {
        _id: '1',
        name: 'physics',
        color: '#fbbf24',
      },
      {
        _id: '2',
        name: 'mathematics',
        color: '#60a5fa',
      },
    ],
    memberCount: 42,
    creator: {
      _id: 'creator-1',
      username: 'CreatorUser',
    },
  };

  const authenticatedUser: AuthUser = {
    _id: 'auth-1',
    email: 'auth@example.com',
    username: 'AuthUser',
  };

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders channel title', () => {
    renderWithRouter(
      <ChannelCard
        channel={mockChannel}
        getFieldColor={mockGetFieldColor}
      />
    );

    expect(screen.getByText('Quantum Physics Discussion')).toBeInTheDocument();
  });

  it('renders channel description', () => {
    renderWithRouter(
      <ChannelCard
        channel={mockChannel}
        getFieldColor={mockGetFieldColor}
      />
    );

    expect(
      screen.getByText('A forum for discussing quantum mechanics and related topics')
    ).toBeInTheDocument();
  });

  it('renders all tags with capitalized names', () => {
    renderWithRouter(
      <ChannelCard
        channel={mockChannel}
        getFieldColor={mockGetFieldColor}
      />
    );

    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
  });

  it('renders member count', () => {
    renderWithRouter(
      <ChannelCard
        channel={mockChannel}
        getFieldColor={mockGetFieldColor}
      />
    );

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('members')).toBeInTheDocument();
  });

  it('renders default member count of 1 when not provided', () => {
    const channelWithoutMembers = { ...mockChannel, memberCount: undefined };

    renderWithRouter(
      <ChannelCard
        channel={channelWithoutMembers}
        getFieldColor={mockGetFieldColor}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders Join Discussion button', () => {
    renderWithRouter(
      <ChannelCard
        channel={mockChannel}
        getFieldColor={mockGetFieldColor}
      />
    );

    expect(screen.getByText('Join Discussion')).toBeInTheDocument();
  });

  it('does not render tags section when tags array is empty', () => {
    const channelWithoutTags = { ...mockChannel, tags: [] };

    renderWithRouter(
      <ChannelCard
        channel={channelWithoutTags}
        getFieldColor={mockGetFieldColor}
      />
    );

    expect(screen.queryByText('Physics')).not.toBeInTheDocument();
    expect(screen.queryByText('Mathematics')).not.toBeInTheDocument();
  });

  it('shows creator name when user is authenticated', async () => {
    renderWithRouter(
      <ChannelCard channel={mockChannel} getFieldColor={mockGetFieldColor} />,
      '/',
      { authUser: authenticatedUser, authToken: 'token' },
    );

    expect(screen.getByText('CreatorUser')).toBeInTheDocument();
  });

  it('hides creator details for guests', async () => {
    renderWithRouter(
      <ChannelCard channel={mockChannel} getFieldColor={mockGetFieldColor} />,
    );

    expect(screen.queryByText('CreatorUser')).not.toBeInTheDocument();
  });
});
