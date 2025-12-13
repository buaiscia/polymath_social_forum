import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import axios from 'axios';
import { renderWithRouter } from '../test/utils';
import type { AuthUser } from '../context/authTypes';
import Channel from './Channel';

vi.mock('axios');

interface MockMessage {
  _id: string;
  channel: string;
  author?: string;
  authorId?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  __v?: number;
  parentMessage?: string | null;
  isDraft?: boolean;
  isOrphaned?: boolean;
}

const mockChannel = {
  _id: 'chan-1',
  title: 'Test Channel',
  description: 'Exploring advanced topics.',
  tags: [],
  createdAt: '2025-08-08T21:46:00.000Z',
  creator: {
    _id: 'creator-1',
    username: 'CreatorUser',
  },
};

const initialMessage: MockMessage = {
  _id: 'msg-1',
  channel: mockChannel._id,
  author: 'Scholar',
  authorId: 'user-2',
  content: 'Initial statement.',
  createdAt: '2025-08-08T21:50:00.000Z',
};

const mockAuthUser: AuthUser = {
  _id: 'user-1',
  email: 'scholar@example.com',
  username: 'Scholar',
};

const renderChannel = () =>
  renderWithRouter(
    <Routes>
      <Route path="/channels/:id" element={<Channel />} />
    </Routes>,
    `/channels/${mockChannel._id}`,
    { authUser: mockAuthUser },
  );

describe('Channel messaging flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.post).mockResolvedValue({ data: null });
    vi.mocked(axios.patch).mockResolvedValue({ data: null });
    vi.mocked(axios.delete).mockResolvedValue({ data: null });
  });

  const mockGet = (messages: MockMessage[] = []) => {
    vi.mocked(axios.get).mockImplementation((url) => {
      if (typeof url === 'string') {
        if (url.includes('/channels/')) {
          return Promise.resolve({ data: mockChannel });
        }
        if (url.includes('/messages')) {
          return Promise.resolve({ data: messages });
        }
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

  it('renders the channel creator in the header when present', async () => {
    mockGet();
    vi.mocked(axios.post).mockResolvedValue({ data: null });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Created by')).toBeInTheDocument();
      expect(screen.getByText('CreatorUser')).toBeInTheDocument();
    });
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

    fireEvent.change(screen.getByPlaceholderText(/share your thoughts/i), {
      target: { value: 'Sharing a new idea.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/messages',
        {
          channelId: mockChannel._id,
          content: 'Sharing a new idea.',
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

  it('opens the inline reply form and posts a threaded reply', async () => {
    mockGet([initialMessage]);
    const replyResponse: MockMessage = {
      _id: 'msg-reply-1',
      channel: mockChannel._id,
      author: 'Grace',
      content: 'Responding in-thread.',
      createdAt: '2025-08-08T22:10:00.000Z',
      parentMessage: initialMessage._id,
    };

    vi.mocked(axios.post).mockResolvedValue({ data: replyResponse });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Initial statement.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /^reply$/i })[0]);

    const replyTextarea = screen.getByPlaceholderText(/share your reply/i);
    const replyForm = replyTextarea.closest('form');
    expect(replyForm).not.toBeNull();

    if (!replyForm) return;

    expect(within(replyForm).getByRole('button', { name: /save draft/i })).toBeInTheDocument();

    fireEvent.change(replyTextarea, { target: { value: 'Responding in-thread.' } });

    fireEvent.click(within(replyForm).getByRole('button', { name: /send reply/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/messages',
        {
          channelId: mockChannel._id,
          content: 'Responding in-thread.',
          parentMessageId: initialMessage._id,
        },
      );
      expect(screen.getByText('Responding in-thread.')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/share your reply/i)).not.toBeInTheDocument();
    });
  });

  it('collapses and expands reply threads while showing counts', async () => {
    const threadedChild: MockMessage = {
      _id: 'msg-child-1',
      channel: mockChannel._id,
      content: 'Nested perspective.',
      createdAt: '2025-08-08T23:00:00.000Z',
      parentMessage: initialMessage._id,
    };

    mockGet([initialMessage, threadedChild]);
    vi.mocked(axios.post).mockResolvedValue({ data: null });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Nested perspective.')).toBeInTheDocument();
      expect(screen.getByText(/1 reply/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /hide replies \(1\)/i }));

    await waitFor(() => {
      expect(screen.queryByText('Nested perspective.')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /show replies \(1\)/i }));

    await waitFor(() => {
      expect(screen.getByText('Nested perspective.')).toBeInTheDocument();
    });
  });

  it('saves a draft without clearing the composer', async () => {
    mockGet();
    const draftResponse: MockMessage = {
      _id: 'draft-1',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Draft exploration.',
      createdAt: '2025-08-09T00:00:00.000Z',
      isDraft: true,
    };

    vi.mocked(axios.post).mockResolvedValue({ data: draftResponse });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Conversation')).toBeInTheDocument();
    });

    const messageInput = screen.getByPlaceholderText(/share your thoughts/i);
    fireEvent.change(messageInput, { target: { value: 'Draft exploration.' } });

    fireEvent.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/messages', {
        channelId: mockChannel._id,
        content: 'Draft exploration.',
        isDraft: true,
      });
      expect(messageInput).toHaveValue('Draft exploration.');
      expect(screen.getByText(/composer mode: draft/i)).toBeInTheDocument();
      expect(screen.getAllByText('Draft')[0]).toBeInTheDocument();
    });
  });

  it('updates an existing draft when saving again', async () => {
    mockGet();
    const draftResponse: MockMessage = {
      _id: 'draft-2',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Initial draft',
      createdAt: '2025-08-09T00:15:00.000Z',
      isDraft: true,
    };

    vi.mocked(axios.post).mockResolvedValueOnce({ data: draftResponse });
    vi.mocked(axios.patch).mockResolvedValueOnce({
      data: { ...draftResponse, content: 'Refined thought', updatedAt: '2025-08-09T00:20:00.000Z' },
    });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Conversation')).toBeInTheDocument();
    });

    const messageInput = screen.getByPlaceholderText(/share your thoughts/i);
    const composerHeading = screen.getByRole('heading', { name: /add to the conversation/i });
    const composerForm = composerHeading.closest('form') as HTMLFormElement | null;
    expect(composerForm).not.toBeNull();
    if (!composerForm) return;

    fireEvent.change(messageInput, { target: { value: 'Initial draft' } });
    fireEvent.click(within(composerForm).getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });

    fireEvent.change(messageInput, { target: { value: 'Refined thought' } });
    fireEvent.click(within(composerForm).getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(`/messages/${draftResponse._id}`, {
        content: 'Refined thought',
        isDraft: true,
      });
    });
  });

  it('publishes an existing draft when sending the message', async () => {
    const existingDraft: MockMessage = {
      _id: 'draft-3',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Publish me',
      createdAt: '2025-08-09T00:30:00.000Z',
      isDraft: true,
    };

    const publishedMessage = { ...existingDraft, isDraft: false };

    mockGet([existingDraft]);
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: publishedMessage });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Publish me')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(`/messages/${existingDraft._id}`, {
        content: 'Publish me',
        publish: true,
      });
      expect(screen.getByPlaceholderText(/share your thoughts/i)).toHaveValue('');
      expect(screen.getByText(/composer mode: publish/i)).toBeInTheDocument();
    });
  });

  it('renders publish controls for draft threads', async () => {
    const inlineDraft: MockMessage = {
      _id: 'draft-inline',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Inline draft idea.',
      createdAt: '2025-08-09T01:00:00.000Z',
      isDraft: true,
    };

    mockGet([initialMessage, inlineDraft]);
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: { ...inlineDraft, isDraft: false } });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Inline draft idea.')).toBeInTheDocument();
    });

    const [draftTextNode] = screen.getAllByText('Inline draft idea.');
    const draftCard = draftTextNode.closest('[data-testid="conversation-message"]') as HTMLElement | null;
    expect(draftCard).not.toBeNull();
    if (!draftCard) return;
    const draftCardElement = draftCard;

    expect(within(draftCardElement).queryByRole('button', { name: /^reply$/i })).toBeNull();

    const publishButton = within(draftCardElement).getByRole('button', { name: /^publish$/i });
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(`/messages/${inlineDraft._id}`, {
        publish: true,
      });
    });
  });

  it('allows inline editing and saving of a root draft', async () => {
    const rootDraft: MockMessage = {
      _id: 'draft-root-inline',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Inline root hypothesis.',
      createdAt: '2025-08-09T01:30:00.000Z',
      isDraft: true,
    };

    const updatedDraft = {
      ...rootDraft,
      content: 'Refined inline hypothesis.',
      updatedAt: '2025-08-09T01:45:00.000Z',
    };

    mockGet([rootDraft]);
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: updatedDraft });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Inline root hypothesis.')).toBeInTheDocument();
    });

    const draftTextNode = screen
      .getAllByText('Inline root hypothesis.')
      .find((node) => node.closest('[data-testid="conversation-message"]'));
    expect(draftTextNode).toBeDefined();
    if (!draftTextNode) return;
    const draftCard = draftTextNode.closest('[data-testid="conversation-message"]') as HTMLElement | null;
    expect(draftCard).not.toBeNull();
    if (!draftCard) return;
    const draftCardElement = draftCard;

    fireEvent.click(within(draftCardElement).getByRole('button', { name: /^edit$/i }));

    const inlineTextarea = within(draftCardElement).getByRole('textbox');
    expect(inlineTextarea).toHaveValue('Inline root hypothesis.');

    fireEvent.change(inlineTextarea, { target: { value: 'Refined inline hypothesis.' } });

    fireEvent.click(within(draftCardElement).getByRole('button', { name: /^save draft$/i }));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(`/messages/${rootDraft._id}`, {
        content: 'Refined inline hypothesis.',
        isDraft: true,
      });
    });

    await waitFor(() => {
      expect(inlineTextarea).toHaveValue('Refined inline hypothesis.');
      expect(screen.getByPlaceholderText(/share your thoughts/i)).toHaveValue('Refined inline hypothesis.');
    });
  });

  it('allows inline editing of a published root message and marks it edited', async () => {
    const ownedRoot: MockMessage = {
      _id: 'owned-root-inline',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Owned root insight.',
      createdAt: '2025-08-09T01:50:00.000Z',
    };

    const updatedRoot: MockMessage = {
      ...ownedRoot,
      content: 'Updated root insight.',
      updatedAt: '2025-08-09T02:00:00.000Z',
      __v: 1,
    };

    mockGet([ownedRoot]);
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: updatedRoot });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Owned root insight.')).toBeInTheDocument();
    });

    const rootCard = screen
      .getByText('Owned root insight.')
      .closest('[data-testid="conversation-message"]') as HTMLElement | null;
    expect(rootCard).not.toBeNull();
    if (!rootCard) return;

    fireEvent.click(within(rootCard).getByRole('button', { name: /^edit$/i }));

    const inlineTextarea = within(rootCard).getByRole('textbox');
    fireEvent.change(inlineTextarea, { target: { value: 'Updated root insight.' } });

    fireEvent.click(within(rootCard).getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(`/messages/${ownedRoot._id}`, {
        content: 'Updated root insight.',
      });
    });

    await waitFor(() => {
      expect(within(rootCard).getAllByText(/edited/i).length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(within(rootCard).queryByRole('textbox')).toBeNull();
      expect(within(rootCard).getByText('Updated root insight.')).toBeInTheDocument();
    });
  });

  it('resets inline editing state after canceling changes on a published message', async () => {
    const ownedRoot: MockMessage = {
      _id: 'owned-root-cancel',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Cancelable root insight.',
      createdAt: '2025-08-09T02:05:00.000Z',
    };

    mockGet([ownedRoot]);
    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Cancelable root insight.')).toBeInTheDocument();
    });

    const rootCard = screen
      .getByText('Cancelable root insight.')
      .closest('[data-testid="conversation-message"]') as HTMLElement | null;
    expect(rootCard).not.toBeNull();
    if (!rootCard) return;

    fireEvent.click(within(rootCard).getByRole('button', { name: /^edit$/i }));

    const inlineTextarea = within(rootCard).getByRole('textbox');
    fireEvent.change(inlineTextarea, { target: { value: 'Temp rewrite' } });

    fireEvent.click(within(rootCard).getByRole('button', { name: /^cancel$/i }));

    await waitFor(() => {
      expect(within(rootCard).queryByRole('textbox')).toBeNull();
      expect(within(rootCard).getByText('Cancelable root insight.')).toBeInTheDocument();
    });

    fireEvent.click(within(rootCard).getByRole('button', { name: /^edit$/i }));

    const reopenedTextarea = within(rootCard).getByRole('textbox');
    expect(reopenedTextarea).toHaveValue('Cancelable root insight.');
  });

  it('saves a reply draft without closing the composer', async () => {
    mockGet([initialMessage]);

    const replyDraft: MockMessage = {
      _id: 'reply-draft-1',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Reply draft text.',
      createdAt: '2025-08-09T02:00:00.000Z',
      parentMessage: initialMessage._id,
      isDraft: true,
    };

    vi.mocked(axios.post).mockResolvedValueOnce({ data: replyDraft });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Initial statement.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /^reply$/i })[0]);

    const replyTextarea = screen.getByPlaceholderText(/share your reply/i);
    fireEvent.change(replyTextarea, { target: { value: 'Reply draft text.' } });

    const replyForm = replyTextarea.closest('form');
    expect(replyForm).not.toBeNull();
    if (!replyForm) return;

    fireEvent.click(within(replyForm).getByRole('button', { name: /^save draft$/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/messages', {
        channelId: mockChannel._id,
        content: 'Reply draft text.',
        parentMessageId: initialMessage._id,
        isDraft: true,
      });
      expect(replyTextarea).toHaveValue('Reply draft text.');
    });
  });

  it('hides the inline reply editor after canceling the composer', async () => {
    mockGet([initialMessage]);

    const replyDraft: MockMessage = {
      _id: 'reply-draft-cancel',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Reply draft text.',
      createdAt: '2025-08-09T02:05:00.000Z',
      parentMessage: initialMessage._id,
      isDraft: true,
    };

    vi.mocked(axios.post).mockResolvedValueOnce({ data: replyDraft });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Initial statement.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /^reply$/i })[0]);

    const replyTextarea = screen.getByPlaceholderText(/share your reply/i);
    fireEvent.change(replyTextarea, { target: { value: 'Reply draft text.' } });

    const replyForm = replyTextarea.closest('form');
    expect(replyForm).not.toBeNull();
    if (!replyForm) return;

    fireEvent.click(within(replyForm).getByRole('button', { name: /^save draft$/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/messages', {
        channelId: mockChannel._id,
        content: 'Reply draft text.',
        parentMessageId: initialMessage._id,
        isDraft: true,
      });
    });

    fireEvent.click(within(replyForm).getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/share your reply/i)).toBeNull();
    });

    const draftCard = screen
      .getByText('Reply draft text.')
      .closest('[data-testid="conversation-message"]') as HTMLElement | null;
    expect(draftCard).not.toBeNull();
    if (!draftCard) return;

    expect(within(draftCard).queryByRole('textbox')).toBeNull();
  });

  it('saves a reply draft and closes the composer when requested', async () => {
    mockGet([initialMessage]);

    const replyDraft: MockMessage = {
      _id: 'reply-draft-close',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Reply draft close.',
      createdAt: '2025-08-09T02:07:00.000Z',
      parentMessage: initialMessage._id,
      isDraft: true,
    };

    vi.mocked(axios.post).mockResolvedValueOnce({ data: replyDraft });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Initial statement.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /^reply$/i })[0]);

    const replyTextarea = screen.getByPlaceholderText(/share your reply/i);
    fireEvent.change(replyTextarea, { target: { value: 'Reply draft close.' } });

    const replyForm = replyTextarea.closest('form');
    expect(replyForm).not.toBeNull();
    if (!replyForm) return;

    fireEvent.click(within(replyForm).getByRole('button', { name: /save & close/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/messages', {
        channelId: mockChannel._id,
        content: 'Reply draft close.',
        parentMessageId: initialMessage._id,
        isDraft: true,
      });
    });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/share your reply/i)).toBeNull();
    });
  });

  it('updates an existing reply draft when saving again', async () => {
    const existingReplyDraft: MockMessage = {
      _id: 'reply-draft-2',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Original reply draft.',
      createdAt: '2025-08-09T02:10:00.000Z',
      parentMessage: initialMessage._id,
      isDraft: true,
    };

    mockGet([initialMessage, existingReplyDraft]);

    vi.mocked(axios.patch).mockResolvedValueOnce({
      data: { ...existingReplyDraft, content: 'Refined reply draft.', updatedAt: '2025-08-09T02:20:00.000Z' },
    });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Initial statement.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /^reply$/i })[0]);

    const replyTextarea = screen.getByPlaceholderText(/share your reply/i);
    await waitFor(() => {
      expect(replyTextarea).toHaveValue('Original reply draft.');
    });

    fireEvent.change(replyTextarea, { target: { value: 'Refined reply draft.' } });

    const replyForm = replyTextarea.closest('form');
    expect(replyForm).not.toBeNull();
    if (!replyForm) return;

    fireEvent.click(within(replyForm).getByRole('button', { name: /^save draft$/i }));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(`/messages/${existingReplyDraft._id}`, {
        content: 'Refined reply draft.',
        isDraft: true,
      });
    });
  });

  it('publishes inline reply drafts after editing content', async () => {
    const replyDraft: MockMessage = {
      _id: 'reply-inline-draft',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Inline reply draft.',
      createdAt: '2025-08-09T02:30:00.000Z',
      parentMessage: initialMessage._id,
      isDraft: true,
    };

    const publishedReply: MockMessage = {
      ...replyDraft,
      content: 'Finalized inline reply.',
      isDraft: false,
      updatedAt: '2025-08-09T02:40:00.000Z',
    };

    mockGet([initialMessage, replyDraft]);
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: publishedReply });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Inline reply draft.')).toBeInTheDocument();
    });

    const replyDraftNode = screen.getByText('Inline reply draft.');
    const replyDraftCard = replyDraftNode.closest('[data-testid="conversation-message"]') as HTMLElement | null;
    expect(replyDraftCard).not.toBeNull();
    if (!replyDraftCard) return;
    const replyDraftElement = replyDraftCard;

    fireEvent.click(within(replyDraftElement).getByRole('button', { name: /^edit$/i }));

    const replyTextarea = within(replyDraftElement).getByRole('textbox');
    fireEvent.change(replyTextarea, { target: { value: 'Finalized inline reply.' } });

    const publishButtons = within(replyDraftElement).getAllByRole('button', { name: /^publish$/i });
    fireEvent.click(publishButtons[publishButtons.length - 1]);

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(`/messages/${replyDraft._id}`, {
        publish: true,
        content: 'Finalized inline reply.',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Finalized inline reply.')).toBeInTheDocument();
    });

    const publishedNode = screen.getByText('Finalized inline reply.');
    const publishedCard = publishedNode.closest('[data-testid="conversation-message"]') as HTMLElement | null;
    expect(publishedCard).not.toBeNull();
    if (!publishedCard) return;
    const publishedCardElement = publishedCard;

    expect(within(publishedCardElement).queryByRole('textbox')).toBeNull();
    expect(within(publishedCardElement).queryByRole('button', { name: /^save draft$/i })).toBeNull();
    expect(within(publishedCardElement).queryByText('Draft')).toBeNull();
  });

  it('allows inline editing of a published reply and surfaces the Edited indicator', async () => {
    const ownedRoot: MockMessage = {
      _id: 'root-for-owned-reply',
      channel: mockChannel._id,
      author: 'Peer Scholar',
      authorId: 'peer-2',
      content: 'Peer prompt.',
      createdAt: '2025-08-09T02:45:00.000Z',
    };

    const ownedReply: MockMessage = {
      _id: 'owned-reply',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Owned reply content.',
      createdAt: '2025-08-09T02:50:00.000Z',
      parentMessage: ownedRoot._id,
    };

    const updatedReply: MockMessage = {
      ...ownedReply,
      content: 'Revised owned reply.',
      updatedAt: '2025-08-09T02:55:00.000Z',
      __v: 2,
    };

    mockGet([ownedRoot, ownedReply]);
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: updatedReply });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Owned reply content.')).toBeInTheDocument();
    });

    const replyCard = screen
      .getByText('Owned reply content.')
      .closest('[data-testid="conversation-message"]') as HTMLElement | null;
    expect(replyCard).not.toBeNull();
    if (!replyCard) return;

    fireEvent.click(within(replyCard).getByRole('button', { name: /^edit$/i }));

    const replyTextarea = within(replyCard).getByRole('textbox');
    fireEvent.change(replyTextarea, { target: { value: 'Revised owned reply.' } });

    fireEvent.click(within(replyCard).getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(`/messages/${ownedReply._id}`, {
        content: 'Revised owned reply.',
      });
    });

    await waitFor(() => {
      expect(within(replyCard).getAllByText(/edited/i).length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(within(replyCard).queryByRole('textbox')).toBeNull();
      expect(within(replyCard).getByText('Revised owned reply.')).toBeInTheDocument();
    });
  });

  it('shows draft-specific delete copy for draft messages', async () => {
    const ownDraft: MockMessage = {
      _id: 'draft-to-delete',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Draft slated for deletion',
      createdAt: '2025-08-09T03:00:00.000Z',
      isDraft: true,
    };

    mockGet([ownDraft]);
    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Draft slated for deletion')).toBeInTheDocument();
    });

    const [draftMessageNode] = screen.getAllByText('Draft slated for deletion', { selector: 'p' });
    expect(draftMessageNode).toBeDefined();
    const draftCard = draftMessageNode?.closest('[data-testid="conversation-message"]');
    expect(draftCard).not.toBeNull();
    if (!draftCard) return;

    fireEvent.click(within(draftCard as HTMLElement).getByRole('button', { name: /^delete$/i }));

    const dialog = await screen.findByRole('alertdialog', { name: /delete message/i });
    expect(within(dialog).getByText('This action will permanently delete your draft message.')).toBeInTheDocument();
  });

  it('warns about replies becoming read-only when deleting published messages with replies', async () => {
    const ownedRoot: MockMessage = {
      _id: 'owned-root-delete',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Root with replies',
      createdAt: '2025-08-09T03:00:00.000Z',
    };

    const childReply: MockMessage = {
      _id: 'reply-stays',
      channel: mockChannel._id,
      author: 'Peer',
      authorId: 'peer-1',
      content: 'Reply that will remain',
      createdAt: '2025-08-09T03:05:00.000Z',
      parentMessage: ownedRoot._id,
    };

    mockGet([ownedRoot, childReply]);
    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Root with replies')).toBeInTheDocument();
      expect(screen.getByText('Reply that will remain')).toBeInTheDocument();
    });

    const rootCard = screen.getByText('Root with replies').closest('[data-testid="conversation-message"]');
    expect(rootCard).not.toBeNull();
    if (!rootCard) return;

    fireEvent.click(within(rootCard as HTMLElement).getByRole('button', { name: /^delete$/i }));

    const dialog = await screen.findByRole('alertdialog', { name: /delete message/i });
    expect(
      within(dialog).getByText(
        'This action removes your message permanently. Any existing replies will stay visible but become read-only threads.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the general permanent delete copy when no replies exist', async () => {
    const ownedRoot: MockMessage = {
      _id: 'owned-root-lone',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Solo root message',
      createdAt: '2025-08-09T03:00:00.000Z',
    };

    mockGet([ownedRoot]);
    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Solo root message')).toBeInTheDocument();
    });

    const rootCard = screen.getByText('Solo root message').closest('[data-testid="conversation-message"]');
    expect(rootCard).not.toBeNull();
    if (!rootCard) return;

    fireEvent.click(within(rootCard as HTMLElement).getByRole('button', { name: /^delete$/i }));

    const dialog = await screen.findByRole('alertdialog', { name: /delete message/i });
    expect(within(dialog).getByText('This action removes your message permanently.')).toBeInTheDocument();
  });

  it('deletes a message and keeps replies as orphaned read-only threads', async () => {
    const ownedRoot: MockMessage = {
      _id: 'owned-root',
      channel: mockChannel._id,
      author: mockAuthUser.username,
      authorId: mockAuthUser._id,
      content: 'Owned root content',
      createdAt: '2025-08-09T03:00:00.000Z',
    };

    const childReply: MockMessage = {
      _id: 'child-1',
      channel: mockChannel._id,
      author: 'Peer',
      authorId: 'peer-1',
      content: 'Child reply that will be orphaned',
      createdAt: '2025-08-09T03:05:00.000Z',
      parentMessage: ownedRoot._id,
    };

    mockGet([ownedRoot, childReply]);
    vi.mocked(axios.delete).mockResolvedValue({ data: { deletedId: ownedRoot._id } });

    renderChannel();

    await waitFor(() => {
      expect(screen.getByText('Owned root content')).toBeInTheDocument();
      expect(screen.getByText('Child reply that will be orphaned')).toBeInTheDocument();
    });

    const [rootCard] = screen.getAllByTestId('conversation-message');
    fireEvent.click(within(rootCard).getByRole('button', { name: /^delete$/i }));

    const dialog = await screen.findByRole('alertdialog', { name: /delete message/i });
    fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/messages/owned-root');
      expect(screen.queryByText('Owned root content')).not.toBeInTheDocument();
    });

    const placeholderCard = screen
      .getByText(/^Deleted message$/i)
      .closest('[data-testid="conversation-message"]') as HTMLElement | null;
    expect(placeholderCard).not.toBeNull();
    if (!placeholderCard) return;
    expect(within(placeholderCard).getByText(/message has been deleted/i)).toBeInTheDocument();
    expect(within(placeholderCard).queryByRole('button', { name: /^reply$/i })).toBeNull();

    const orphanCard = screen
      .getByText('Child reply that will be orphaned')
      .closest('[data-testid="conversation-message"]') as HTMLElement | null;
    expect(orphanCard).not.toBeNull();
    if (!orphanCard) return;

    expect(within(orphanCard).getByText(/replies disabled/i)).toBeInTheDocument();
    expect(within(orphanCard).queryByRole('button', { name: /^reply$/i })).toBeNull();
  });
});
