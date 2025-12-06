import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  Button,
  Heading,
  HStack,
  VStack,
  Icon,
  Flex,
  Input,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiFilter } from 'react-icons/fi';
import axios from 'axios';
import ChannelCard, { type ChannelSummary } from './ChannelCard';
import { useAuth } from '../context/useAuth';
import { useUserDirectory } from '../hooks/useUserDirectory';

interface Tag {
  _id: string;
  name: string;
  color: string;
}

const Dashboard = () => {
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { usersById } = useUserDirectory(Boolean(user));

  const resolveCreatorName = useCallback(
    (creator: ChannelSummary['creator']) => {
      if (!user || !creator) return undefined;
      if (typeof creator === 'string') {
        return usersById[creator]?.username;
      }
      return creator.username;
    },
    [user, usersById],
  );

  // Fetch channels from backend with optional tag filtering
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);

        // Build query string with selected tags
        const queryParams = selectedTags.length > 0
          ? `?tags=${selectedTags.join(',')}`
          : '';

        const response = await axios.get(`http://localhost:5000/api/channels${queryParams}`);
        setChannels(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch channels:', err);
        setError('Failed to load channels');
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [selectedTags]); // Re-fetch when selectedTags changes

  // Fetch tags from backend
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/tags');
        setTags(response.data);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    };

    fetchTags();
  }, []);

  const getFieldColor = (field: string) => `academic.${field}`;

  // Toggle tag selection
  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => {
      const isCurrentlySelected = prev.some(t => t.toLowerCase() === tagName.toLowerCase());
      if (isCurrentlySelected) {
        return prev.filter(t => t.toLowerCase() !== tagName.toLowerCase());
      } else {
        return [...prev, tagName];
      }
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTags([]);
  };

  return (
    <Box px={12} py={8}>
      {/* Header Section */}
      <VStack spacing={8} align="stretch" mb={8}>
        <VStack spacing={3} align="flex-start">
          <HStack spacing={3}>
            <Box w="32px" h="32px" borderRadius="md" bg="navy.800" />
            <Heading size="lg" color="navy.800">Polymath Network</Heading>
          </HStack>
          <Text color="gray.600" fontSize="lg">
            Where interdisciplinary minds converge to explore the connections between all fields of knowledge.
          </Text>
        </VStack>

        {/* Search Input */}
        <Box>
          <Input
            placeholder="Search channels, topics, or fields..."
            size="lg"
            bg="white"
            borderRadius="full"
            borderColor="gray.200"
            _focus={{
              borderColor: 'navy.200',
              boxShadow: 'none',
            }}
          />
        </Box>

        {/* Filter Section */}
        <VStack spacing={4} align="stretch">
          <HStack spacing={3}>
            <Icon as={FiFilter} color="gray.600" />
            <Text color="gray.600">Filter by field:</Text>
            <Button
              bg={selectedTags.length === 0 ? 'navy.800' : 'gray.300'}
              color={selectedTags.length === 0 ? 'white' : 'gray.600'}
              size="sm"
              borderRadius="full"
              px={6}
              _hover={{ bg: selectedTags.length === 0 ? 'navy.700' : 'gray.400' }}
              onClick={clearFilters}
            >
              All Fields {selectedTags.length > 0 && `(${channels.length})`}
            </Button>
            {selectedTags.length > 0 && (
              <Text color="gray.500" fontSize="sm">
                Filtering by: {selectedTags.join(', ')}
              </Text>
            )}
          </HStack>

          <HStack spacing={2} wrap="wrap">
            {tags.map((tag) => {
              const isSelected = selectedTags.some(t => t.toLowerCase() === tag.name.toLowerCase());
              return (
                <Button
                  key={tag._id}
                  bg={tag.color}
                  color="white"
                  size="sm"
                  borderRadius="full"
                  px={4}
                  _hover={{ opacity: 0.9, transform: 'scale(1.05)' }}
                  onClick={() => toggleTag(tag.name)}
                  border="3px solid"
                  borderColor={isSelected ? 'gray.800' : 'transparent'}
                  cursor="pointer"
                  opacity={isSelected ? 1 : 0.75}
                  boxShadow={isSelected ? 'lg' : 'md'}
                  transition="all 0.2s"
                >
                  {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
                </Button>
              );
            })}
          </HStack>
        </VStack>
      </VStack>

      {/* Channel Grid */}
      {loading ? (
        <Flex justify="center" align="center" minH="200px">
          <VStack spacing={4}>
            <Spinner size="lg" color="navy.600" />
            <Text color="gray.600">Loading channels...</Text>
          </VStack>
        </Flex>
      ) : error ? (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          {error}. Please try again later.
        </Alert>
      ) : null}

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
        {channels.map((channel, index) => (
          <ChannelCard
            key={channel._id || channel.id || `channel-${index}`}
            channel={channel}
            getFieldColor={getFieldColor}
            creatorName={resolveCreatorName(channel.creator)}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default Dashboard;
