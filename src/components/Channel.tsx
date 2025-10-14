import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Heading,
  Spinner,
  Tag,
  TagLabel,
  Text,
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
    <Box px={{ base: 4, md: 12 }} py={10}>
      <VStack align="stretch" spacing={8} maxW="960px" mx="auto">
        <Button
          as={RouterLink}
          to="/"
          alignSelf="flex-start"
          variant="ghost"
          colorScheme="navy"
        >
          ← Back to channels
        </Button>

        <VStack align="stretch" spacing={3} bg="white" boxShadow="sm" borderRadius="xl" p={{ base: 6, md: 8 }}>
          <HStack justify="space-between" align="flex-start" spacing={6}>
            <VStack align="flex-start" spacing={2}>
              <Heading size="lg" color="gray.900">
                {channel.title}
              </Heading>
              {channel.createdAt && (
                <Text fontSize="sm" color="gray.500">
                  Created {formatDate(channel.createdAt)}
                </Text>
              )}
            </VStack>
          </HStack>
          <Text fontSize="md" color="gray.600" lineHeight="1.7">
            {channel.description}
          </Text>
          {channel.tags?.length > 0 && (
            <HStack spacing={2} pt={2} wrap="wrap">
              {channel.tags.map((tag) => (
                <Tag key={tag._id} size="md" borderRadius="full" bg={tag.color} color="white" px={3} py={1}>
                  <TagLabel>{tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}</TagLabel>
                </Tag>
              ))}
            </HStack>
          )}
        </VStack>

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
      </VStack>
    </Box>
  );
};

export default Channel;
