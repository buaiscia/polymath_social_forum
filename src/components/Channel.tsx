import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertIcon,
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
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/useAuth';

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
  author?: string;
  content: string;
  createdAt: string;
  parentMessage?: string | null;
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
  const roots = sorted.filter((message) => !message.parentMessage);

  if (!roots.length) {
    return {
      primaryMessage: null,
      primaryChildren: [] as MessageType[],
      otherThreads: sorted.map((message) => ({ root: message, children: [] })),
    };
  }

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

  const [primaryMessage, ...otherRoots] = roots;
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

const Channel = () => {
  const { id } = useParams<{ id: string }>();
  const { user, openLoginModal, openRegisterModal } = useAuth();
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rootMessage, setRootMessage] = useState('');
  const [rootSubmitError, setRootSubmitError] = useState<string | null>(null);
  const [isRootSubmitting, setIsRootSubmitting] = useState(false);
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitError, setReplySubmitError] = useState<string | null>(null);
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const [collapsedThreadIds, setCollapsedThreadIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) {
      setError('No channel id provided.');
      setLoading(false);
      return;
    }

    const fetchChannel = async () => {
      try {
        setLoading(true);
        const [channelResponse, messagesResponse] = await Promise.all([
          axios.get<ChannelType>(`/channels/${id}`),
          axios.get<MessageType[]>(`/messages`, {
            params: { channelId: id },
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
  }, [id]);

  const isAuthenticated = Boolean(user);

  const ensureAuthenticated = () => {
    if (!user) {
      openLoginModal();
      return false;
    }
    return true;
  };

  const { primaryMessage, primaryChildren, otherThreads } = useMemo(
    () => buildThreadStructure(messages),
    [messages],
  );

  const handleRootMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (rootSubmitError) setRootSubmitError(null);
    setRootMessage(event.target.value);
  };

  const handleReplyMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (replySubmitError) setReplySubmitError(null);
    setReplyMessage(event.target.value);
  };

  const handleReplyCancel = () => {
    setReplyParentId(null);
    setReplyMessage('');
    setReplySubmitError(null);
  };

  const handleReplyToggle = (messageId: string) => {
    if (!user) {
      openLoginModal();
      return;
    }
    if (replyParentId === messageId) {
      handleReplyCancel();
      return;
    }
    setReplyParentId(messageId);
    setReplyMessage('');
    setReplySubmitError(null);
  };

  const toggleThreadVisibility = (messageId: string) => {
    setCollapsedThreadIds((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleRootSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = rootMessage.trim();

    if (!id || !trimmedContent) {
      return;
    }

    if (!ensureAuthenticated()) {
      return;
    }

    try {
      setIsRootSubmitting(true);
      setRootSubmitError(null);

      const response = await axios.post<MessageType>('/messages', {
        channelId: id,
        content: trimmedContent,
      });

      setMessages((prev) => [...prev, response.data]);
      setRootMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setRootSubmitError('Unable to send your message right now. Please try again.');
    } finally {
      setIsRootSubmitting(false);
    }
  };

  const handleReplySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = replyMessage.trim();

    if (!id || !replyParentId || !trimmedContent) {
      return;
    }

    if (!ensureAuthenticated()) {
      return;
    }

    const parentId = replyParentId;

    try {
      setIsReplySubmitting(true);
      setReplySubmitError(null);

      const response = await axios.post<MessageType>('/messages', {
        channelId: id,
        content: trimmedContent,
        parentMessageId: replyParentId,
      });

      setMessages((prev) => [...prev, response.data]);
      setCollapsedThreadIds((prev) => ({
        ...prev,
        [parentId]: false,
      }));
      handleReplyCancel();
    } catch (err) {
      console.error('Failed to send reply:', err);
      setReplySubmitError('Unable to send your reply right now. Please try again.');
    } finally {
      setIsReplySubmitting(false);
    }
  };

  const isRootSubmitDisabled = !rootMessage.trim() || isRootSubmitting;
  const isReplySubmitDisabled = !replyMessage.trim() || isReplySubmitting;
  const hasMessages = Boolean(primaryMessage || otherThreads.length);

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
            <Textarea
              value={replyMessage}
              onChange={handleReplyMessageChange}
              placeholder="Share your reply"
              rows={3}
              bg="white"
              borderColor="gray.200"
              _focus={{ borderColor: 'navy.300', boxShadow: 'none' }}
              size="sm"
            />
          </FormControl>

          {replySubmitError && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {replySubmitError}
            </Alert>
          )}

          <HStack justify="flex-end">
            <Button type="button" variant="ghost" size="sm" onClick={handleReplyCancel}>
              Cancel
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

  const resolvedCreatorName = channel && channel.creator && typeof channel.creator !== 'string'
    ? channel.creator.username
    : undefined;

  return (
    <Box>
      {/* Full-width page header */}
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
                {primaryMessage && (
                  <Box
                    data-testid="conversation-message"
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor="navy.600"
                    bg="white"
                    boxShadow="md"
                    p={{ base: 5, md: 6 }}
                  >
                    <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between" align="flex-start" spacing={4}>
                        <VStack align="flex-start" spacing={1}>
                          <Text fontWeight="semibold" color="gray.800">
                            {primaryMessage.author || 'Anonymous'}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            Original post · {formatDate(primaryMessage.createdAt)}
                          </Text>
                        </VStack>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReplyToggle(primaryMessage._id)}
                        >
                          {replyParentId === primaryMessage._id ? 'Cancel reply' : 'Reply'}
                        </Button>
                      </HStack>

                      <Text color="gray.700" lineHeight="1.8">
                        {primaryMessage.content}
                      </Text>

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

                      {replyParentId === primaryMessage._id && renderReplyForm()}

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
                            <Box
                              key={child._id}
                              data-testid="conversation-message"
                              bg="gray.50"
                              borderRadius="lg"
                              borderWidth="1px"
                              borderColor="gray.200"
                              p={{ base: 4, md: 5 }}
                            >
                              <HStack justify="space-between" spacing={4} mb={2}>
                                <Text fontWeight="medium" color="gray.700">
                                  {child.author || 'Anonymous'}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  {formatDate(child.createdAt)}
                                </Text>
                              </HStack>
                              <Text color="gray.700" lineHeight="1.7">
                                {child.content}
                              </Text>
                            </Box>
                          ))}
                        </VStack>
                      )}
                    </VStack>
                  </Box>
                )}

                {otherThreads.length > 0 && primaryMessage && <Divider borderColor="gray.200" />}

                {otherThreads.length > 0 && (
                  <VStack align="stretch" spacing={4}>
                    {otherThreads.map(({ root, children }) => {
                      const childCount = children.length;
                      const isReplyingHere = replyParentId === root._id;
                      const isCollapsed = collapsedThreadIds[root._id];
                      return (
                        <Box
                          key={root._id}
                          data-testid="conversation-message"
                          bg="white"
                          borderRadius="xl"
                          borderWidth="1px"
                          borderColor="gray.200"
                          boxShadow="sm"
                          p={{ base: 4, md: 5 }}
                        >
                          <VStack align="stretch" spacing={3}>
                            <HStack justify="space-between" spacing={4}>
                              <Text fontWeight="medium" color="gray.700">
                                {root.author || 'Anonymous'}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                {formatDate(root.createdAt)}
                              </Text>
                            </HStack>

                            <Text color="gray.700" lineHeight="1.7">
                              {root.content}
                            </Text>

                            <HStack spacing={3} justify="space-between" wrap="wrap">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReplyToggle(root._id)}
                              >
                                {isReplyingHere ? 'Cancel reply' : 'Reply'}
                              </Button>

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

                            {isReplyingHere && renderReplyForm()}

                            {childCount > 0 && !isCollapsed && (
                              <VStack
                                align="stretch"
                                spacing={3}
                                pl={{ base: 4, md: 6 }}
                                borderLeftWidth="3px"
                                borderColor="navy.200"
                              >
                                {children.map((child) => (
                                  <Box
                                    key={child._id}
                                    data-testid="conversation-message"
                                    bg="gray.50"
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor="gray.200"
                                    p={{ base: 4, md: 5 }}
                                  >
                                    <HStack justify="space-between" spacing={4} mb={2}>
                                      <Text fontWeight="medium" color="gray.700">
                                        {child.author || 'Anonymous'}
                                      </Text>
                                      <Text fontSize="sm" color="gray.500">
                                        {formatDate(child.createdAt)}
                                      </Text>
                                    </HStack>
                                    <Text color="gray.700" lineHeight="1.7">
                                      {child.content}
                                    </Text>
                                  </Box>
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
                  <Textarea
                    value={rootMessage}
                    onChange={handleRootMessageChange}
                    placeholder="Share your thoughts, references, or questions..."
                    rows={4}
                    bg="gray.50"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'navy.300', boxShadow: 'none' }}
                  />
                </FormControl>

                {rootSubmitError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {rootSubmitError}
                  </Alert>
                )}

                <Button
                  type="submit"
                  alignSelf={{ base: 'stretch', md: 'flex-end' }}
                  colorScheme="navy"
                  color="white"
                  bg="navy.800"
                  _hover={{ bg: 'navy.700' }}
                  isLoading={isRootSubmitting}
                  isDisabled={isRootSubmitDisabled}
                >
                  Send message
                </Button>
              </VStack>
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default Channel;
