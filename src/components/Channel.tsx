import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Input,
  Spinner,
  Tag,
  TagLabel,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import axios from 'axios';

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
}

interface MessageType {
  _id: string;
  channel: string;
  author?: string;
  content: string;
  createdAt: string;
}

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

const Channel = () => {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorInput, setAuthorInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          axios.get<ChannelType>(`http://localhost:5000/api/channels/${id}`),
          axios.get<MessageType[]>(`http://localhost:5000/api/messages`, {
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

  const [firstMessage, otherMessages] = useMemo(() => {
    if (!messages.length) return [null, []] as const;
    return [messages[0], messages.slice(1)] as const;
  }, [messages]);

  const handleAuthorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (submitError) setSubmitError(null);
    setAuthorInput(event.target.value);
  };

  const handleMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (submitError) setSubmitError(null);
    setMessageInput(event.target.value);
  };

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = messageInput.trim();

    if (!id || !trimmedContent) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const response = await axios.post<MessageType>('http://localhost:5000/api/messages', {
        channelId: id,
        content: trimmedContent,
        author: authorInput.trim() || undefined,
      });

      setMessages((prev) => [...prev, response.data]);
      setMessageInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setSubmitError('Unable to send your message right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSendDisabled = !messageInput.trim() || isSubmitting;

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

            {!firstMessage && (
              <Box bg="white" borderRadius="lg" boxShadow="sm" p={6}>
                <Text color="gray.600">No messages yet. Start the conversation!</Text>
              </Box>
            )}

            {firstMessage && (
              <VStack align="stretch" spacing={4}>
                <Box
                  data-testid="conversation-message"
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="navy.600"
                  bg="white"
                  boxShadow="md"
                  p={{ base: 5, md: 6 }}
                >
                  <HStack justify="space-between" align="flex-start" spacing={4} mb={2}>
                    <VStack align="flex-start" spacing={1}>
                      <Text fontWeight="semibold" color="gray.800">
                        {firstMessage.author || 'Anonymous'}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Original post · {formatDate(firstMessage.createdAt)}
                      </Text>
                    </VStack>
                  </HStack>
                  <Text color="gray.700" lineHeight="1.8">
                    {firstMessage.content}
                  </Text>
                </Box>

                {otherMessages.length > 0 && <Divider borderColor="gray.200" />}

                {otherMessages.length > 0 && (
                  <VStack align="stretch" spacing={4}>
                    {otherMessages.map((message) => (
                      <Box
                        key={message._id}
                        data-testid="conversation-message"
                        bg="white"
                        borderRadius="xl"
                        borderWidth="1px"
                        borderColor="gray.200"
                        boxShadow="sm"
                        p={{ base: 5, md: 6 }}
                      >
                        <HStack justify="space-between" spacing={4} mb={2}>
                          <Text fontWeight="medium" color="gray.700">
                            {message.author || 'Anonymous'}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {formatDate(message.createdAt)}
                          </Text>
                        </HStack>
                        <Text color="gray.700" lineHeight="1.7">
                          {message.content}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            )}
          </VStack>

          <Box
            as="form"
            onSubmit={handleSendMessage}
            bg="white"
            borderRadius="xl"
            boxShadow="sm"
            p={{ base: 5, md: 6 }}
          >
            <VStack align="stretch" spacing={5}>
              <Heading size="sm" color="gray.800">
                Add to the conversation
              </Heading>

              <FormControl>
                <FormLabel fontSize="sm" color="gray.600">
                  Display name (optional)
                </FormLabel>
                <Input
                  value={authorInput}
                  onChange={handleAuthorChange}
                  placeholder="Your name (optional)"
                  bg="gray.50"
                  borderColor="gray.200"
                  _focus={{ borderColor: 'navy.300', boxShadow: 'none' }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" color="gray.600">
                  Message
                </FormLabel>
                <Textarea
                  value={messageInput}
                  onChange={handleMessageChange}
                  placeholder="Share your thoughts, references, or questions..."
                  rows={4}
                  bg="gray.50"
                  borderColor="gray.200"
                  _focus={{ borderColor: 'navy.300', boxShadow: 'none' }}
                />
              </FormControl>

              {submitError && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {submitError}
                </Alert>
              )}

              <Button
                type="submit"
                alignSelf={{ base: 'stretch', md: 'flex-end' }}
                colorScheme="navy"
                color="white"
                bg="navy.800"
                _hover={{ bg: 'navy.700' }}
                isLoading={isSubmitting}
                isDisabled={isSendDisabled}
              >
                Send message
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default Channel;
