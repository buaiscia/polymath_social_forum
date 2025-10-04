import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import ChannelCard from './ChannelCard';

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
  };

  it('renders channel title', () => {
    render(
      <ChannelCard
        channel={mockChannel}
        index={0}
        getFieldColor={mockGetFieldColor}
      />
    );

    expect(screen.getByText('Quantum Physics Discussion')).toBeInTheDocument();
  });

  it('renders channel description', () => {
    render(
      <ChannelCard
        channel={mockChannel}
        index={0}
        getFieldColor={mockGetFieldColor}
      />
    );

    expect(
      screen.getByText('A forum for discussing quantum mechanics and related topics')
    ).toBeInTheDocument();
  });

  it('renders all tags with capitalized names', () => {
    render(
      <ChannelCard
        channel={mockChannel}
        index={0}
        getFieldColor={mockGetFieldColor}
      />
    );

    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
  });

  it('renders member count', () => {
    render(
      <ChannelCard
        channel={mockChannel}
        index={0}
        getFieldColor={mockGetFieldColor}
      />
    );

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('members')).toBeInTheDocument();
  });

  it('renders default member count of 1 when not provided', () => {
    const channelWithoutMembers = { ...mockChannel, memberCount: undefined };

    render(
      <ChannelCard
        channel={channelWithoutMembers}
        index={0}
        getFieldColor={mockGetFieldColor}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders Join Discussion button', () => {
    render(
      <ChannelCard
        channel={mockChannel}
        index={0}
        getFieldColor={mockGetFieldColor}
      />
    );

    expect(screen.getByText('Join Discussion')).toBeInTheDocument();
  });

  it('does not render tags section when tags array is empty', () => {
    const channelWithoutTags = { ...mockChannel, tags: [] };

    render(
      <ChannelCard
        channel={channelWithoutTags}
        index={0}
        getFieldColor={mockGetFieldColor}
      />
    );

    expect(screen.queryByText('Physics')).not.toBeInTheDocument();
    expect(screen.queryByText('Mathematics')).not.toBeInTheDocument();
  });
});
