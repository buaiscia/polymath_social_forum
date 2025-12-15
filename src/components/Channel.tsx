import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Avatar,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Spinner,
  Tag,
  TagLabel,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/useAuth';
import RichTextEditor from './RichTextEditor';
import RichTextRenderer from './RichTextRenderer';
import { getPlainTextFromHtml, isRichTextEmpty, sanitizeRichText } from '../utils/sanitizeHtml';

interface TagType {
  _id: string;
  name: string;
  color: string;
}

interface ChannelType {
  _id: string;
  title: string;
  description: string;
  tags: TagType[];
  createdAt?: string;
  creator?:
  | {
    _id: string;
    username: string;
  }
  | string;
}

interface MessageType {
  _id: string;
  channel: string;
  authorId?: string;
  author?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  __v?: number;
  parentMessage?: string | null;
  isDraft?: boolean;
  isOrphaned?: boolean;
  isPlaceholder?: boolean;
  placeholderFor?: string | null;
}

interface ThreadGroup {
  root: MessageType;
  children: MessageType[];
}

const sortByCreatedAt = (a: MessageType, b: MessageType) => {
  const aTime = new Date(a.createdAt).getTime();
  const bTime = new Date(b.createdAt).getTime();
  return aTime - bTime;
};

const buildThreadStructure = (allMessages: MessageType[]) => {
  if (!allMessages.length) {
    return {
      primaryMessage: null,
      primaryChildren: [] as MessageType[],
      otherThreads: [] as ThreadGroup[],
    };
  }

  const sorted = [...allMessages].sort(sortByCreatedAt);
  const messageMap = new Map(sorted.map((message) => [message._id, message]));
  const childrenMap = new Map<string, MessageType[]>();

  sorted.forEach((message) => {
    if (message.parentMessage) {
      const existing = childrenMap.get(message.parentMessage) ?? [];
      existing.push(message);
      childrenMap.set(message.parentMessage, existing);
    }
  });

  childrenMap.forEach((childList, key) => {
    childrenMap.set(key, childList.sort(sortByCreatedAt));
  });

  const placeholderRecords: MessageType[] = [];
  const missingParents: Array<{ parentId: string; children: MessageType[] }> = [];

  childrenMap.forEach((childList, parentId) => {
    if (!messageMap.has(parentId)) {
      missingParents.push({ parentId, children: childList });
    }
  });

  missingParents.forEach(({ parentId, children }) => {
    if (!children.length) {
      childrenMap.delete(parentId);
      return;
    }

    const earliestChild = children[0];
    const referenceDate = earliestChild?.createdAt ? new Date(earliestChild.createdAt).getTime() : Date.now();
    const placeholderTimestamp = new Date(referenceDate - 1000).toISOString();
    const placeholderId = `placeholder-${parentId}`;
    const placeholderMessage: MessageType = {
      _id: placeholderId,
      channel: children[0].channel,
      author: 'Deleted message',
      content: 'Message has been deleted',
      createdAt: placeholderTimestamp,
      parentMessage: null,
      isDraft: false,
      isPlaceholder: true,
      isOrphaned: true,
      placeholderFor: parentId,
    };

    placeholderRecords.push(placeholderMessage);
    childrenMap.set(placeholderId, children);
    childrenMap.delete(parentId);
  });

  const augmentedRoots = [...sorted, ...placeholderRecords].sort(sortByCreatedAt).filter((message) => !message.parentMessage);

  if (!augmentedRoots.length) {
    return {
      primaryMessage: null,
      primaryChildren: [] as MessageType[],
      otherThreads: [...placeholderRecords.map((placeholder) => ({
        root: placeholder,
        children: childrenMap.get(placeholder._id) ?? [],
      }))],
    };
  }

  const [primaryMessage, ...otherRoots] = augmentedRoots;
  const primaryChildren = primaryMessage ? childrenMap.get(primaryMessage._id) ?? [] : [];
  const otherThreads: ThreadGroup[] = otherRoots.map((root) => ({
    root,
    children: childrenMap.get(root._id) ?? [],
  }));

  return { primaryMessage: primaryMessage ?? null, primaryChildren, otherThreads };
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const replyCountLabel = (count: number) => `${count} repl${count === 1 ? 'y' : 'ies'}`;

const wasMessageEdited = (message: MessageType) => {
  if (message.isDraft || message.isPlaceholder) {
    return false;
  }
  const version = typeof message.__v === 'number' ? message.__v : 0;
  return version > 0;
};

const getMessageCardStyles = (
  message?: MessageType | null,
  variant: 'primary' | 'threadRoot' | 'child' = 'primary',
) => {
  if (!message) {
    return { bg: 'white', borderColor: 'gray.200', borderStyle: 'solid' };
  }

  if (message.isPlaceholder) {
    return { bg: 'gray.50', borderColor: 'gray.300', borderStyle: 'dashed' };
  }

  if (message.isDraft) {
    return {
      bg: 'purple.50',
      borderColor: variant === 'primary' ? 'purple.300' : 'purple.200',
      borderStyle: 'solid',
    };
  }

  return {
    bg: variant === 'child' ? 'gray.50' : 'white',
    borderColor: variant === 'primary' ? 'navy.600' : 'gray.200',
    borderStyle: 'solid',
  };
};

const renderMessageTags = (message: MessageType) => (
  <>
    {message.isPlaceholder && (
      <Tag size="sm" colorScheme="gray" variant="subtle">
        Deleted
      </Tag>
    )}
    {message.isDraft && (
      <Tag size="sm" colorScheme="purple" variant="subtle">
        Draft
      </Tag>
    )}
    {message.isOrphaned && (
      <Tag size="sm" colorScheme="orange" variant="subtle">
        Replies disabled
      </Tag>
    )}
    {wasMessageEdited(message) && (
      <Tag size="sm" colorScheme="gray" variant="subtle">
        Edited
      </Tag>
    )}
  </>
);

const Channel = () => {
  const { id } = useParams<{ id: string }>();
  const { user, openLoginModal, openRegisterModal } = useAuth();
  const toast = useToast();
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rootMessage, setRootMessage] = useState('');
  const [composerMode, setComposerMode] = useState<'draft' | 'publish'>('publish');
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [rootSubmitError, setRootSubmitError] = useState<string | null>(null);
  const [isRootSubmitting, setIsRootSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [publishingDraftId, setPublishingDraftId] = useState<string | null>(null);
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitError, setReplySubmitError] = useState<string | null>(null);
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const [activeReplyDraftId, setActiveReplyDraftId] = useState<string | null>(null);
  const [isSavingReplyDraft, setIsSavingReplyDraft] = useState(false);
  const [collapsedThreadIds, setCollapsedThreadIds] = useState<Record<string, boolean>>({});
  const lastKnownDraftIdRef = useRef<string | null>(null);
  const replyDraftMetaRef = useRef<Record<string, { id: string; content: string }>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  const [editingMessageParentId, setEditingMessageParentId] = useState<string | null>(null);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editingMessageError, setEditingMessageError] = useState<string | null>(null);
  const [inlineMessageSavingId, setInlineMessageSavingId] = useState<string | null>(null);
  const [messagePendingDeletion, setMessagePendingDeletion] = useState<MessageType | null>(null);
  const [isDeletingMessageId, setIsDeletingMessageId] = useState<string | null>(null);
  const deleteDialogCancelRef = useRef<HTMLButtonElement | null>(null);

  const authUserId = user?._id ?? null;

  useEffect(() => {
    if (!id) {
      setError('No channel id provided.');
      setLoading(false);
      return;
    }

    const fetchChannel = async () => {
      try {
        setLoading(true);
        const messageParams: Record<string, string> = { channelId: id };
        if (authUserId) {
          messageParams.includeDrafts = 'true';
        }
        const [channelResponse, messagesResponse] = await Promise.all([
          axios.get<ChannelType>(`/channels/${id}`),
          axios.get<MessageType[]>(`/messages`, {
            params: messageParams,
          }),
        ]);

        setChannel(channelResponse.data);
        setMessages(messagesResponse.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch channel details:', err);
        setError('Unable to load this channel right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
  }, [id, authUserId]);

  const isAuthenticated = Boolean(user);

  const ensureAuthenticated = () => {
    if (!user) {
      openLoginModal();
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!authUserId) {
      lastKnownDraftIdRef.current = null;
      setActiveDraftId(null);
      setComposerMode('publish');
      setRootMessage('');
      return;
    }

    const existingDraft = messages.find(
      (message) =>
        Boolean(message.isDraft) &&
        !message.parentMessage &&
        message.authorId === authUserId,
    );

    if (existingDraft) {
      if (lastKnownDraftIdRef.current !== existingDraft._id) {
        setRootMessage(sanitizeRichText(existingDraft.content));
      }
      lastKnownDraftIdRef.current = existingDraft._id;
      setActiveDraftId(existingDraft._id);
      setComposerMode('draft');
    } else if (lastKnownDraftIdRef.current) {
      lastKnownDraftIdRef.current = null;
      setActiveDraftId(null);
      setComposerMode('publish');
    }
  }, [messages, authUserId]);

  useEffect(() => {
    if (!replyParentId) {
      setActiveReplyDraftId(null);
      setReplyMessage('');
      return;
    }

    if (!authUserId) {
      setActiveReplyDraftId(null);
      return;
    }

    const existingDraft = messages.find(
      (message) =>
        Boolean(message.isDraft) &&
        message.parentMessage === replyParentId &&
        message.authorId === authUserId,
    );

    if (existingDraft) {
      const cached = replyDraftMetaRef.current[replyParentId];
      if (!cached || cached.id !== existingDraft._id || cached.content !== existingDraft.content) {
        setReplyMessage(sanitizeRichText(existingDraft.content));
        replyDraftMetaRef.current[replyParentId] = {
          id: existingDraft._id,
          content: existingDraft.content,
        };
      }
      setActiveReplyDraftId(existingDraft._id);
    } else {
      delete replyDraftMetaRef.current[replyParentId];
      setActiveReplyDraftId(null);
    }
  }, [messages, replyParentId, authUserId]);

  const { primaryMessage, primaryChildren, otherThreads } = useMemo(
    () => buildThreadStructure(messages),
    [messages],
  );

  const upsertMessage = (updatedMessage: MessageType) => {
    setMessages((prev) => {
      const exists = prev.some((message) => message._id === updatedMessage._id);
      if (exists) {
        return prev.map((message) => (message._id === updatedMessage._id ? updatedMessage : message));
      }
      return [...prev, updatedMessage];
    });
  };

  const isOwnDraft = (message: MessageType) =>
    Boolean(message.isDraft && message.authorId && authUserId && message.authorId === authUserId);

  const canEditMessage = (message: MessageType) =>
    Boolean(isMessageAuthor(message) && !message.isPlaceholder);

  const isMessageAuthor = (message: MessageType) =>
    Boolean(authUserId && message.authorId && message.authorId === authUserId);

  const canMessageReceiveReplies = (message?: MessageType | null) =>
    Boolean(message && !message.isDraft && !message.isOrphaned && !message.isPlaceholder);

  const handleRootEditorChange = (nextHtml: string) => {
    const sanitized = sanitizeRichText(nextHtml);
    if (rootSubmitError && !isRichTextEmpty(sanitized)) setRootSubmitError(null);
    setRootMessage(sanitized);
  };

  const handleReplyEditorChange = (nextHtml: string) => {
    const sanitized = sanitizeRichText(nextHtml);
    if (replySubmitError && !isRichTextEmpty(sanitized)) setReplySubmitError(null);
    setReplyMessage(sanitized);
  };

  const clearReplyDraftMetaEntry = (parentId?: string | null) => {
    if (parentId && replyDraftMetaRef.current[parentId]) {
      delete replyDraftMetaRef.current[parentId];
    }
  };

  const handleReplyCancel = () => {
    const previousParentId = replyParentId;
    setReplyParentId(null);
    setReplyMessage('');
    setReplySubmitError(null);
    setActiveReplyDraftId(null);
    clearReplyDraftMetaEntry(previousParentId);
  };

  useEffect(() => {
    const draftIds = new Set(
      messages.filter((message) => message.isDraft).map((message) => message._id),
    );
    Object.entries(replyDraftMetaRef.current).forEach(([parentId, meta]) => {
      if (!meta || !draftIds.has(meta.id)) {
        delete replyDraftMetaRef.current[parentId];
      }
    });
  }, [messages]);

  const handleReplyToggle = (messageId: string) => {
    if (!user) {
      openLoginModal();
      return;
    }
    const targetMessage = messages.find((message) => message._id === messageId);
    if (!canMessageReceiveReplies(targetMessage)) {
      return;
    }
    if (replyParentId === messageId) {
      handleReplyCancel();
      return;
    }
    setReplyParentId(messageId);
    setReplyMessage('');
    setReplySubmitError(null);
    setActiveReplyDraftId(null);
  };

  const startEditingMessage = (message: MessageType) => {
    if (!canEditMessage(message)) {
      return;
    }

    setEditingMessageId(message._id);
    setEditingMessageContent(sanitizeRichText(message.content));
    setEditingMessageParentId(message.parentMessage ?? null);
    setIsEditingDraft(Boolean(message.isDraft));
    setEditingMessageError(null);
  };

  const stopEditingMessage = () => {
    setEditingMessageId(null);
    setEditingMessageContent('');
    setEditingMessageParentId(null);
    setIsEditingDraft(false);
    setEditingMessageError(null);
    setInlineMessageSavingId(null);
  };

  const toggleThreadVisibility = (messageId: string) => {
    setCollapsedThreadIds((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleRootSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sanitizedContent = sanitizeRichText(rootMessage);

    if (!id || isRichTextEmpty(sanitizedContent)) {
      return;
    }

    if (!ensureAuthenticated()) {
      return;
    }

    try {
      setIsRootSubmitting(true);
      setRootSubmitError(null);
      setComposerMode('publish');

      if (activeDraftId) {
        const response = await axios.patch<MessageType>(`/messages/${activeDraftId}`, {
          content: sanitizedContent,
          publish: true,
        });
        upsertMessage(response.data);
      } else {
        const response = await axios.post<MessageType>('/messages', {
          channelId: id,
          content: sanitizedContent,
        });
        upsertMessage(response.data);
      }

      setRootMessage('');
      setActiveDraftId(null);
      lastKnownDraftIdRef.current = null;
      stopEditingMessage();
      toast({
        title: 'Message published',
        status: 'success',
        duration: 3000,
        position: 'bottom-right',
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setRootSubmitError('Unable to send your message right now. Please try again.');
    } finally {
      setIsRootSubmitting(false);
    }
  };

  const handleReplySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sanitizedContent = sanitizeRichText(replyMessage);

    if (!id || !replyParentId || isRichTextEmpty(sanitizedContent)) {
      return;
    }

    if (!ensureAuthenticated()) {
      return;
    }

    const parentId = replyParentId;

    try {
      setIsReplySubmitting(true);
      setReplySubmitError(null);

      let response: { data: MessageType };
      if (activeReplyDraftId) {
        response = await axios.patch<MessageType>(`/messages/${activeReplyDraftId}`, {
          content: sanitizedContent,
          publish: true,
        });
      } else {
        response = await axios.post<MessageType>('/messages', {
          channelId: id,
          content: sanitizedContent,
          parentMessageId: replyParentId,
        });
      }

      upsertMessage(response.data);
      setCollapsedThreadIds((prev) => ({
        ...prev,
        [parentId]: false,
      }));
      delete replyDraftMetaRef.current[parentId];
      setActiveReplyDraftId(null);
      handleReplyCancel();
    } catch (err) {
      console.error('Failed to send reply:', err);
      setReplySubmitError('Unable to send your reply right now. Please try again.');
    } finally {
      setIsReplySubmitting(false);
    }
  };

  const handleReplySaveDraft = async (options: { closeAfterSave?: boolean } = {}) => {
    const { closeAfterSave = false } = options;
    const sanitizedContent = sanitizeRichText(replyMessage);

    if (!id || !replyParentId || isRichTextEmpty(sanitizedContent)) {
      return;
    }

    if (!ensureAuthenticated()) {
      return;
    }

    try {
      setIsSavingReplyDraft(true);
      setReplySubmitError(null);

      let savedMessage: MessageType;
      if (activeReplyDraftId) {
        const response = await axios.patch<MessageType>(`/messages/${activeReplyDraftId}`, {
          content: sanitizedContent,
          isDraft: true,
        });
        savedMessage = response.data;
      } else {
        const response = await axios.post<MessageType>('/messages', {
          channelId: id,
          content: sanitizedContent,
          parentMessageId: replyParentId,
          isDraft: true,
        });
        savedMessage = response.data;
      }

      upsertMessage(savedMessage);
      setActiveReplyDraftId(savedMessage._id);
      replyDraftMetaRef.current[replyParentId] = {
        id: savedMessage._id,
        content: savedMessage.content,
      };
      if (closeAfterSave) {
        handleReplyCancel();
      }
      toast({
        title: 'Reply draft saved',
        status: 'success',
        duration: 3000,
        position: 'bottom-right',
      });
    } catch (err) {
      console.error('Failed to save reply draft:', err);
      setReplySubmitError('Unable to save your draft right now. Please try again.');
    } finally {
      setIsSavingReplyDraft(false);
    }
  };

  const handleSaveDraft = async () => {
    const sanitizedContent = sanitizeRichText(rootMessage);

    if (!id || isRichTextEmpty(sanitizedContent)) {
      return;
    }

    if (!ensureAuthenticated()) {
      return;
    }

    try {
      setIsSavingDraft(true);
      setRootSubmitError(null);

      let savedMessage: MessageType;
      if (activeDraftId) {
        const response = await axios.patch<MessageType>(`/messages/${activeDraftId}`, {
          content: sanitizedContent,
          isDraft: true,
        });
        savedMessage = response.data;
      } else {
        const response = await axios.post<MessageType>('/messages', {
          channelId: id,
          content: sanitizedContent,
          isDraft: true,
        });
        savedMessage = response.data;
      }

      upsertMessage(savedMessage);
      setActiveDraftId(savedMessage._id);
      lastKnownDraftIdRef.current = savedMessage._id;
      setComposerMode('draft');
      toast({
        title: 'Draft saved',
        status: 'success',
        duration: 3000,
        position: 'bottom-right',
      });
    } catch (err) {
      console.error('Failed to save draft:', err);
      setRootSubmitError('Unable to save your draft right now. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleInlineMessageSave = async () => {
    if (!editingMessageId) {
      return;
    }

    const sanitizedContent = sanitizeRichText(editingMessageContent);

    if (isRichTextEmpty(sanitizedContent)) {
      setEditingMessageError('Message cannot be empty.');
      return;
    }

    if (!ensureAuthenticated()) {
      return;
    }

    try {
      setInlineMessageSavingId(editingMessageId);
      setEditingMessageError(null);

      const payload: Record<string, unknown> = { content: sanitizedContent };
      if (isEditingDraft) {
        payload.isDraft = true;
      }

      const response = await axios.patch<MessageType>(`/messages/${editingMessageId}`, payload);

      upsertMessage(response.data);
      setEditingMessageContent(sanitizedContent);

      if (isEditingDraft) {
        if (!editingMessageParentId) {
          setRootMessage(sanitizedContent);
          setActiveDraftId(response.data._id);
          lastKnownDraftIdRef.current = response.data._id;
        } else {
          replyDraftMetaRef.current[editingMessageParentId] = {
            id: response.data._id,
            content: response.data.content,
          };
        }
      }

      toast({
        title: isEditingDraft ? 'Draft updated' : 'Message updated',
        status: 'success',
        duration: 3000,
        position: 'bottom-right',
      });

      if (!isEditingDraft) {
        stopEditingMessage();
      }
    } catch (err) {
      console.error('Failed to update message:', err);
      setEditingMessageError('Unable to update your message right now. Please try again.');
    } finally {
      setInlineMessageSavingId(null);
    }
  };

  const handleInlineDraftPublish = async (message: MessageType) => {
    if (!editingMessageId || editingMessageId !== message._id) {
      return;
    }

    const sanitizedContent = sanitizeRichText(editingMessageContent);

    if (isRichTextEmpty(sanitizedContent)) {
      setEditingMessageError('Message cannot be empty.');
      return;
    }

    await handlePublishDraft(message, sanitizedContent);
  };

  const openDeleteDialog = (message: MessageType) => {
    if (!ensureAuthenticated()) {
      return;
    }
    setMessagePendingDeletion(message);
  };

  const closeDeleteDialog = () => {
    if (isDeletingMessageId) {
      return;
    }
    setMessagePendingDeletion(null);
  };

  const handleConfirmDelete = async () => {
    if (!messagePendingDeletion) {
      return;
    }

    if (!ensureAuthenticated()) {
      setMessagePendingDeletion(null);
      return;
    }

    const target = messagePendingDeletion;
    const orphanedChildIds = messages
      .filter((message) => message.parentMessage === target._id)
      .map((message) => message._id);

    try {
      setIsDeletingMessageId(target._id);
      await axios.delete(`/messages/${target._id}`);

      setMessages((prev) =>
        prev
          .filter((message) => message._id !== target._id)
          .map((message) =>
            message.parentMessage === target._id
              ? { ...message, isOrphaned: true }
              : message,
          ),
      );

      if (activeDraftId === target._id) {
        setActiveDraftId(null);
        lastKnownDraftIdRef.current = null;
        setRootMessage('');
        setComposerMode('publish');
      }

      if (activeReplyDraftId === target._id || orphanedChildIds.includes(activeReplyDraftId ?? '')) {
        setActiveReplyDraftId(null);
      }

      if (replyParentId === target._id || orphanedChildIds.includes(replyParentId ?? '')) {
        handleReplyCancel();
      }

      if (editingMessageId === target._id) {
        stopEditingMessage();
      }

      delete replyDraftMetaRef.current[target._id];
      orphanedChildIds.forEach((childId) => {
        delete replyDraftMetaRef.current[childId];
      });

      toast({
        title: 'Message deleted',
        status: 'success',
        duration: 3000,
        position: 'bottom-right',
      });
    } catch (err) {
      console.error('Failed to delete message:', err);
      toast({
        title: 'Unable to delete message',
        status: 'error',
        duration: 4000,
        position: 'bottom-right',
      });
    } finally {
      setIsDeletingMessageId(null);
      setMessagePendingDeletion(null);
    }
  };

  const handlePublishDraft = async (message: MessageType, updatedContent?: string) => {
    if (!ensureAuthenticated()) {
      return;
    }

    try {
      setPublishingDraftId(message._id);
      const payload: Record<string, unknown> = { publish: true };
      if (typeof updatedContent === 'string') {
        payload.content = updatedContent;
      }
      const response = await axios.patch<MessageType>(`/messages/${message._id}`, payload);
      upsertMessage(response.data);
      if (message._id === activeDraftId) {
        setActiveDraftId(null);
        lastKnownDraftIdRef.current = null;
        setRootMessage('');
        setComposerMode('publish');
      }
      if (message._id === activeReplyDraftId || message.parentMessage) {
        if (message._id === activeReplyDraftId) {
          setActiveReplyDraftId(null);
        }
        if (message.parentMessage) {
          delete replyDraftMetaRef.current[message.parentMessage];
          if (replyParentId === message.parentMessage) {
            setReplyParentId(null);
            setReplyMessage('');
          }
        }
      }
      if (editingMessageId === message._id) {
        stopEditingMessage();
      }
      toast({
        title: 'Draft published',
        status: 'success',
        duration: 3000,
        position: 'bottom-right',
      });
    } catch (err) {
      console.error('Failed to publish draft:', err);
      toast({
        title: 'Unable to publish draft',
        status: 'error',
        duration: 4000,
        position: 'bottom-right',
      });
    } finally {
      setPublishingDraftId(null);
    }
  };

  const isRootContentEmpty = isRichTextEmpty(rootMessage);
  const isReplyContentEmpty = isRichTextEmpty(replyMessage);
  const isRootSubmitDisabled = isRootContentEmpty || isRootSubmitting || isSavingDraft;
  const isRootSaveDisabled = isRootContentEmpty || isSavingDraft || isRootSubmitting;
  const isReplySubmitDisabled = isReplyContentEmpty || isReplySubmitting || isSavingReplyDraft;
  const isReplySaveDisabled = isReplyContentEmpty || isSavingReplyDraft || isReplySubmitting;
  const hasMessages = Boolean(primaryMessage || otherThreads.length);
  const pendingDeletionHasReplies = messagePendingDeletion
    ? messages.some((message) => message.parentMessage === messagePendingDeletion._id)
    : false;

  const renderReplyForm = () => {
    if (!isAuthenticated) {
      return null;
    }

    return (
      <Box
        as="form"
        onSubmit={handleReplySubmit}
        mt={4}
        bg="gray.50"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="gray.200"
        p={4}
      >
        <VStack align="stretch" spacing={3}>
          <Text fontSize="sm" color="gray.600">
            Replying as <strong>{user?.username}</strong>
          </Text>

          <FormControl isRequired>
            <FormLabel fontSize="sm" color="gray.600">
              Reply
            </FormLabel>
            <RichTextEditor
              value={replyMessage}
              onChange={handleReplyEditorChange}
              placeholder="Share your reply"
              ariaLabel="Reply message"
              minHeight="120px"
              isDisabled={isReplySubmitting || isSavingReplyDraft}
            />
          </FormControl>

          {replySubmitError && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {replySubmitError}
            </Alert>
          )}

          <HStack justify="flex-end" spacing={3}>
            <Button type="button" variant="ghost" size="sm" onClick={handleReplyCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              colorScheme="purple"
              onClick={() => handleReplySaveDraft()}
              isLoading={isSavingReplyDraft}
              isDisabled={isReplySaveDisabled}
            >
              Save draft
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              colorScheme="purple"
              onClick={() => handleReplySaveDraft({ closeAfterSave: true })}
              isLoading={isSavingReplyDraft}
              isDisabled={isReplySaveDisabled}
            >
              Save & close
            </Button>
            <Button
              type="submit"
              size="sm"
              colorScheme="navy"
              bg="navy.700"
              color="white"
              _hover={{ bg: 'navy.600' }}
              isLoading={isReplySubmitting}
              isDisabled={isReplySubmitDisabled}
            >
              Send reply
            </Button>
          </HStack>
        </VStack>
      </Box>
    );
  };

  const handleInlineEditorChange = (nextHtml: string) => {
    const sanitized = sanitizeRichText(nextHtml);
    if (editingMessageError && !isRichTextEmpty(sanitized)) {
      setEditingMessageError(null);
    }
    setEditingMessageContent(sanitized);
  };

  const renderEditableDraftContent = (
    message: MessageType,
    options: {
      textareaRows?: number;
      buttonSize?: 'sm' | 'xs';
      textColor?: string;
      lineHeight?: string;
    } = {},
  ) => {
    const {
      textareaRows = 4,
      buttonSize = 'sm',
      textColor = 'gray.700',
      lineHeight = '1.8',
    } = options;
    const isEditingCurrent = editingMessageId === message._id;

    if (message.isPlaceholder) {
      return (
        <VStack align="stretch" spacing={1} mt={1}>
          <Text color="gray.600" fontStyle="italic">
            {message.content}
          </Text>
          <Text fontSize="sm" color="gray.500">
            Existing replies stay visible for context.
          </Text>
        </VStack>
      );
    }

    if (!isEditingCurrent) {
      return (
        <RichTextRenderer content={message.content} color={textColor} lineHeight={lineHeight} />
      );
    }

    const isInlineSaving = inlineMessageSavingId === message._id;
    const isInlinePublishing = publishingDraftId === message._id;
    const disableInlineActions =
      isRichTextEmpty(editingMessageContent) || isInlineSaving || isInlinePublishing;

    return (
      <VStack align="stretch" spacing={2} mt={1}>
        <RichTextEditor
          value={editingMessageContent}
          onChange={handleInlineEditorChange}
          minHeight={`${textareaRows * 24}px`}
          ariaLabel="Edit message"
          isDisabled={isInlineSaving || isInlinePublishing}
        />
        {editingMessageError && (
          <Text fontSize="sm" color="red.500">
            {editingMessageError}
          </Text>
        )}
        <HStack spacing={3} justify="flex-end" flexWrap="wrap">
          <Button size={buttonSize} variant="ghost" onClick={stopEditingMessage}>
            Cancel
          </Button>
          <Button
            size={buttonSize}
            variant="outline"
            colorScheme="purple"
            onClick={handleInlineMessageSave}
            isLoading={isInlineSaving}
            isDisabled={disableInlineActions}
          >
            {isEditingDraft ? 'Save draft' : 'Save changes'}
          </Button>
          {message.isDraft && (
            <Button
              size={buttonSize}
              colorScheme="navy"
              onClick={() => handleInlineDraftPublish(message)}
              isLoading={isInlinePublishing}
              isDisabled={disableInlineActions}
            >
              Publish
            </Button>
          )}
        </HStack>
      </VStack>
    );
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" minH="60vh">
        <VStack spacing={4}>
          <Spinner size="lg" color="navy.600" />
          <Text color="gray.600">Loading channel...</Text>
        </VStack>
      </Flex>
    );
  }

  if (error || !channel) {
    return (
      <Box px={{ base: 4, md: 12 }} py={12}>
        <VStack spacing={6} align="stretch">
          <Button
            as={RouterLink}
            to="/"
            alignSelf="flex-start"
            variant="ghost"
            colorScheme="navy"
          >
            ← Back to channels
          </Button>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error || 'Channel not found.'}
          </Alert>
        </VStack>
      </Box>
    );
  }

  const resolvedCreatorName = channel.creator && typeof channel.creator !== 'string'
    ? channel.creator.username
    : undefined;

  return (
    <Box>
      {/* Full-width page header */}

      <AlertDialog
        isOpen={Boolean(messagePendingDeletion)}
        leastDestructiveRef={deleteDialogCancelRef}
        onClose={closeDeleteDialog}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete message?
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text mb={3}>
                {messagePendingDeletion?.isDraft
                  ? 'This action will permanently delete your draft message.'
                  : pendingDeletionHasReplies
                    ? 'This action removes your message permanently. Any existing replies will stay visible but become read-only threads.'
                    : 'This action removes your message permanently.'}
              </Text>
              {messagePendingDeletion && (
                <Box p={3} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                  <Text fontSize="sm" color="gray.600">
                    {(() => {
                      const previewText = getPlainTextFromHtml(messagePendingDeletion.content);
                      return `“${previewText.slice(0, 140)}${previewText.length > 140 ? '…' : ''}”`;
                    })()}
                  </Text>
                </Box>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={deleteDialogCancelRef}
                onClick={closeDeleteDialog}
                isDisabled={Boolean(isDeletingMessageId)}
              >
                Keep message
              </Button>
              <Button
                colorScheme="red"
                onClick={handleConfirmDelete}
                ml={3}
                isLoading={Boolean(
                  messagePendingDeletion && isDeletingMessageId === messagePendingDeletion._id,
                )}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      <Box
        bg="navy.800"
        color="white"
        py={{ base: 12, md: 16 }}
        px={{ base: 4, md: 12 }}
        mb={8}
      >
        <VStack align="stretch" spacing={6} mx="auto">
          <Button
            as={RouterLink}
            to="/"
            alignSelf="flex-start"
            variant="ghost"
            colorScheme="whiteAlpha"
            color="white"
            _hover={{ bg: 'whiteAlpha.200' }}
          >
            ← Back to channels
          </Button>

          <Flex direction={{ base: 'column', md: 'row' }} gap={{ base: 8, md: 12 }} align={{ base: 'flex-start', md: 'flex-end' }}>
            {/* Stats card */}
            <Box
              bg="white"
              color="navy.800"
              borderRadius="xl"
              px={6}
              py={5}
              textAlign="center"
              boxShadow="xl"
              minW="120px"
            >
              <Text fontSize="3xl" fontWeight="black">
                {messages.length}
              </Text>
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.2em" fontWeight="semibold">
                Messages
              </Text>
              {channel.createdAt && (
                <Text fontSize="xs" color="gray.600" mt={1}>
                  since {formatDate(channel.createdAt)}
                </Text>
              )}
            </Box>

            {/* Channel info */}
            <VStack align="flex-start" spacing={4} flex="1">
              <VStack align="flex-start" spacing={2}>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.3em" color="whiteAlpha.700" fontWeight="semibold">
                  Channel Overview
                </Text>
                <Heading size="xl" lineHeight="1.2" letterSpacing="tight" color="white">
                  {channel.title}
                </Heading>
              </VStack>

              <Text fontSize="lg" color="whiteAlpha.900" lineHeight="1.8">
                {channel.description}
              </Text>

              {resolvedCreatorName && (
                <HStack spacing={3} pt={2}>
                  <Avatar size="sm" name={resolvedCreatorName} bg="whiteAlpha.300" color="navy.900" />
                  <Text fontSize="sm" color="whiteAlpha.900">
                    <Text as="span" fontSize="xs" textTransform="uppercase" letterSpacing="0.3em" color="whiteAlpha.700" fontWeight="semibold" mr={2}>
                      Created by
                    </Text>
                    <Text as="span" fontSize="md" fontWeight="semibold" color="white">
                      {resolvedCreatorName}
                    </Text>
                  </Text>
                </HStack>
              )}

              {channel.tags?.length > 0 && (
                <HStack spacing={2} wrap="wrap" pt={2}>
                  {channel.tags.map((tag) => (
                    <Tag
                      key={tag._id}
                      size="lg"
                      bg="whiteAlpha.200"
                      borderRadius="full"
                      backdropFilter="blur(8px)"
                      color="white"
                      px={4}
                      py={2}
                      border="1px solid"
                      borderColor="whiteAlpha.300"
                    >
                      <TagLabel fontWeight="semibold" fontSize="sm">
                        {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
                      </TagLabel>
                    </Tag>
                  ))}
                </HStack>
              )}
            </VStack>
          </Flex>
        </VStack>
      </Box>

      {/* Main content */}
      <Box px={{ base: 4, md: 12 }} pb={10}>
        <VStack align="stretch" spacing={8} mx="auto">
          <VStack align="stretch" spacing={6}>
            <Heading size="md" color="gray.800">
              Conversation
            </Heading>

            {!hasMessages && (
              <Box bg="white" borderRadius="lg" boxShadow="sm" p={6}>
                <Text color="gray.600">No messages yet. Start the conversation!</Text>
              </Box>
            )}

            {hasMessages && (
              <VStack align="stretch" spacing={6}>
                {primaryMessage && (() => {
                  const primaryCardStyles = getMessageCardStyles(primaryMessage, 'primary');
                  return (
                    <Box
                      data-testid="conversation-message"
                      borderRadius="xl"
                      borderWidth="2px"
                      borderColor={primaryCardStyles.borderColor}
                      borderStyle={primaryCardStyles.borderStyle}
                      bg={primaryCardStyles.bg}
                      boxShadow="md"
                      p={{ base: 5, md: 6 }}
                    >
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between" align="flex-start" spacing={4}>
                          <VStack align="flex-start" spacing={1}>
                            <HStack spacing={2}>
                              <Text fontWeight="semibold" color="gray.800">
                                {primaryMessage.author || 'Anonymous'}
                              </Text>
                              {renderMessageTags(primaryMessage)}
                            </HStack>
                            <Text fontSize="sm" color="gray.500">
                              {formatDate(primaryMessage.createdAt)}
                            </Text>
                          </VStack>
                          <HStack spacing={2}>
                            {isOwnDraft(primaryMessage) && (
                              <Button
                                size="sm"
                                variant="outline"
                                colorScheme="navy"
                                onClick={() => handlePublishDraft(primaryMessage)}
                                isLoading={publishingDraftId === primaryMessage._id}
                              >
                                Publish
                              </Button>
                            )}
                            {canEditMessage(primaryMessage) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditingMessage(primaryMessage)}
                              >
                                Edit
                              </Button>
                            )}
                            {canMessageReceiveReplies(primaryMessage) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReplyToggle(primaryMessage._id)}
                              >
                                {replyParentId === primaryMessage._id ? 'Cancel reply' : 'Reply'}
                              </Button>
                            )}
                            {isMessageAuthor(primaryMessage) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => openDeleteDialog(primaryMessage)}
                              >
                                Delete
                              </Button>
                            )}
                          </HStack>
                        </HStack>

                        {renderEditableDraftContent(primaryMessage, { textareaRows: 6 })}

                        {primaryChildren.length > 0 && (
                          <HStack spacing={3} justify="space-between" wrap="wrap">
                            <Tag size="md" borderRadius="full" bg="navy.50" color="navy.700">
                              {replyCountLabel(primaryChildren.length)}
                            </Tag>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleThreadVisibility(primaryMessage._id)}
                            >
                              {collapsedThreadIds[primaryMessage._id]
                                ? `Show replies (${primaryChildren.length})`
                                : `Hide replies (${primaryChildren.length})`}
                            </Button>
                          </HStack>
                        )}

                        {!primaryMessage.isDraft && replyParentId === primaryMessage._id && renderReplyForm()}

                        {primaryChildren.length > 0 && !collapsedThreadIds[primaryMessage._id] && (
                          <VStack
                            align="stretch"
                            spacing={3}
                            mt={2}
                            pl={{ base: 4, md: 6 }}
                            borderLeftWidth="3px"
                            borderColor="navy.200"
                          >
                            {primaryChildren.map((child) => (
                              (() => {
                                const childCardStyles = getMessageCardStyles(child, 'child');
                                return (
                                  <Box
                                    key={child._id}
                                    data-testid="conversation-message"
                                    bg={childCardStyles.bg}
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor={childCardStyles.borderColor}
                                    borderStyle={childCardStyles.borderStyle}
                                    p={{ base: 4, md: 5 }}
                                  >
                                    <HStack justify="space-between" spacing={4} mb={2}>
                                      <HStack spacing={2}>
                                        <Text fontWeight="medium" color="gray.700">
                                          {child.author || 'Anonymous'}
                                        </Text>
                                        {renderMessageTags(child)}
                                      </HStack>
                                      <HStack spacing={2}>
                                        <Text fontSize="sm" color="gray.500">
                                          {formatDate(child.createdAt)}
                                        </Text>
                                        {isOwnDraft(child) && (
                                          <Button
                                            size="xs"
                                            variant="outline"
                                            colorScheme="navy"
                                            onClick={() => handlePublishDraft(child)}
                                            isLoading={publishingDraftId === child._id}
                                          >
                                            Publish
                                          </Button>
                                        )}
                                        {canEditMessage(child) && (
                                          <Button
                                            size="xs"
                                            variant="ghost"
                                            onClick={() => startEditingMessage(child)}
                                          >
                                            Edit
                                          </Button>
                                        )}
                                        {isMessageAuthor(child) && (
                                          <Button
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="red"
                                            onClick={() => openDeleteDialog(child)}
                                          >
                                            Delete
                                          </Button>
                                        )}
                                      </HStack>
                                    </HStack>
                                    {renderEditableDraftContent(child, {
                                      textareaRows: 4,
                                      buttonSize: 'xs',
                                      lineHeight: '1.7',
                                    })}
                                  </Box>
                                );
                              })()
                            ))}
                          </VStack>
                        )}
                      </VStack>
                    </Box>
                  );
                })()}

                {otherThreads.length > 0 && primaryMessage && <Divider borderColor="gray.200" />}

                {otherThreads.length > 0 && (
                  <VStack align="stretch" spacing={4}>
                    {otherThreads.map(({ root, children }) => {
                      const childCount = children.length;
                      const isReplyingHere = replyParentId === root._id;
                      const isCollapsed = collapsedThreadIds[root._id];
                      const canReplyToRoot = canMessageReceiveReplies(root);
                      const rootCardStyles = getMessageCardStyles(root, 'threadRoot');
                      return (
                        <Box
                          key={root._id}
                          data-testid="conversation-message"
                          bg={rootCardStyles.bg}
                          borderRadius="xl"
                          borderWidth="1px"
                          borderColor={rootCardStyles.borderColor}
                          borderStyle={rootCardStyles.borderStyle}
                          boxShadow="sm"
                          p={{ base: 4, md: 5 }}
                        >
                          <VStack align="stretch" spacing={3}>
                            <HStack justify="space-between" spacing={4}>
                              <HStack spacing={2}>
                                <Text fontWeight="medium" color="gray.700">
                                  {root.author || 'Anonymous'}
                                </Text>
                                {renderMessageTags(root)}
                              </HStack>
                              <HStack spacing={2}>
                                <Text fontSize="sm" color="gray.500">
                                  {formatDate(root.createdAt)}
                                </Text>
                                {isOwnDraft(root) && (
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    colorScheme="navy"
                                    onClick={() => handlePublishDraft(root)}
                                    isLoading={publishingDraftId === root._id}
                                  >
                                    Publish
                                  </Button>
                                )}
                                {canEditMessage(root) && (
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => startEditingMessage(root)}
                                  >
                                    Edit
                                  </Button>
                                )}
                                {isMessageAuthor(root) && (
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => openDeleteDialog(root)}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </HStack>
                            </HStack>

                            {renderEditableDraftContent(root, {
                              textareaRows: 4,
                              buttonSize: 'sm',
                              lineHeight: '1.7',
                            })}

                            <HStack spacing={3} justify="space-between" wrap="wrap">
                              {canReplyToRoot && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleReplyToggle(root._id)}
                                >
                                  {isReplyingHere ? 'Cancel reply' : 'Reply'}
                                </Button>
                              )}
                              {childCount > 0 && (
                                <HStack spacing={2}>
                                  <Tag size="sm" borderRadius="full" bg="navy.50" color="navy.700">
                                    {replyCountLabel(childCount)}
                                  </Tag>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => toggleThreadVisibility(root._id)}
                                  >
                                    {isCollapsed
                                      ? `Show replies (${childCount})`
                                      : `Hide replies (${childCount})`}
                                  </Button>
                                </HStack>
                              )}
                            </HStack>

                            {canReplyToRoot && isReplyingHere && renderReplyForm()}

                            {childCount > 0 && !isCollapsed && (
                              <VStack
                                align="stretch"
                                spacing={3}
                                pl={{ base: 4, md: 6 }}
                                borderLeftWidth="3px"
                                borderColor="navy.200"
                              >
                                {children.map((child) => (
                                  (() => {
                                    const childStyles = getMessageCardStyles(child, 'child');
                                    return (
                                      <Box
                                        key={child._id}
                                        data-testid="conversation-message"
                                        bg={childStyles.bg}
                                        borderRadius="lg"
                                        borderWidth="1px"
                                        borderColor={childStyles.borderColor}
                                        borderStyle={childStyles.borderStyle}
                                        p={{ base: 4, md: 5 }}
                                      >
                                        <HStack justify="space-between" spacing={4} mb={2}>
                                          <HStack spacing={2}>
                                            <Text fontWeight="medium" color="gray.700">
                                              {child.author || 'Anonymous'}
                                            </Text>
                                            {renderMessageTags(child)}
                                          </HStack>
                                          <HStack spacing={2}>
                                            <Text fontSize="sm" color="gray.500">
                                              {formatDate(child.createdAt)}
                                            </Text>
                                            {isOwnDraft(child) && (
                                              <Button
                                                size="xs"
                                                variant="outline"
                                                colorScheme="navy"
                                                onClick={() => handlePublishDraft(child)}
                                                isLoading={publishingDraftId === child._id}
                                              >
                                                Publish
                                              </Button>
                                            )}
                                            {canEditMessage(child) && (
                                              <Button
                                                size="xs"
                                                variant="ghost"
                                                onClick={() => startEditingMessage(child)}
                                              >
                                                Edit
                                              </Button>
                                            )}
                                            {isMessageAuthor(child) && (
                                              <Button
                                                size="xs"
                                                variant="ghost"
                                                colorScheme="red"
                                                onClick={() => openDeleteDialog(child)}
                                              >
                                                Delete
                                              </Button>
                                            )}
                                          </HStack>
                                        </HStack>
                                        {renderEditableDraftContent(child, {
                                          textareaRows: 4,
                                          buttonSize: 'xs',
                                          lineHeight: '1.7',
                                        })}
                                      </Box>
                                    );
                                  })()
                                ))}
                              </VStack>
                            )}
                          </VStack>
                        </Box>
                      );
                    })}
                  </VStack>
                )}
              </VStack>
            )}
          </VStack>

          {!isAuthenticated ? (
            <Box bg="white" borderRadius="xl" boxShadow="sm" p={{ base: 5, md: 6 }}>
              <VStack align="stretch" spacing={4}>
                <Heading size="sm" color="gray.800">
                  Sign in to participate
                </Heading>
                <Text color="gray.600">
                  Join the conversation by creating an account or signing in. Replies are attributed to your profile so discussions stay authentic.
                </Text>
                <HStack spacing={3}>
                  <Button colorScheme="navy" onClick={openLoginModal} flex="1">
                    Login
                  </Button>
                  <Button variant="outline" colorScheme="navy" onClick={openRegisterModal} flex="1">
                    Register
                  </Button>
                </HStack>
              </VStack>
            </Box>
          ) : (
            <Box
              as="form"
              onSubmit={handleRootSubmit}
              bg="white"
              borderRadius="xl"
              boxShadow="sm"
              p={{ base: 5, md: 6 }}
            >
              <VStack align="stretch" spacing={5}>
                <Heading size="sm" color="gray.800">
                  Add to the conversation
                </Heading>

                <Text fontSize="sm" color="gray.500">
                  Signed in as <strong>{user?.username}</strong>
                </Text>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="gray.600">
                    Message
                  </FormLabel>
                  <RichTextEditor
                    value={rootMessage}
                    onChange={handleRootEditorChange}
                    placeholder="Share your thoughts, references, or questions..."
                    ariaLabel="Channel message"
                    minHeight="160px"
                    isDisabled={isRootSubmitting || isSavingDraft}
                  />
                </FormControl>

                {rootSubmitError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {rootSubmitError}
                  </Alert>
                )}
                <HStack justify="space-between" flexWrap="wrap" spacing={3} align="center">
                  <Text fontSize="xs" color="gray.500">
                    Composer mode: {composerMode === 'draft' ? 'Draft' : 'Publish'}
                  </Text>
                  <HStack spacing={3}>
                    <Button
                      type="button"
                      variant="outline"
                      colorScheme="purple"
                      onClick={handleSaveDraft}
                      isLoading={isSavingDraft}
                      isDisabled={isRootSaveDisabled}
                    >
                      Save draft
                    </Button>
                    <Button
                      type="submit"
                      colorScheme="navy"
                      color="white"
                      bg="navy.800"
                      _hover={{ bg: 'navy.700' }}
                      isLoading={isRootSubmitting}
                      isDisabled={isRootSubmitDisabled}
                    >
                      Send message
                    </Button>
                  </HStack>
                </HStack>
              </VStack>
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default Channel;
