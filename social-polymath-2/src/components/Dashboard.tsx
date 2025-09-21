import { useState, useEffect } from 'react';
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
import ChannelCard from './ChannelCard';

interface Channel {
  id: string;
  title: string;
  description: string;
  tags: string[]; // Changed from 'fields' to 'tags' to match backend
  memberCount?: number; // Made optional since backend might not have this
}

const Dashboard = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch channels from backend
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/channels');
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
  }, []);

  const getFieldColor = (field: string) => `academic.${field}`;

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
              bg="navy.800"
              color="white"
              size="sm"
              borderRadius="full"
              px={6}
              _hover={{ bg: 'navy.700' }}
            >
              All Fields
            </Button>
          </HStack>

          <HStack spacing={2} wrap="wrap">
            {[
              'biology',
              'physics',
              'mathematics',
              'philosophy',
              'psychology',
              'literature',
              'chemistry',
              'history'
            ].map((field) => (
              <Button
                key={field}
                bg={getFieldColor(field)}
                color="white"
                size="sm"
                borderRadius="full"
                px={4}
                _hover={{ opacity: 0.9 }}
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </Button>
            ))}
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
            key={channel.id || `channel-${index}`}
            channel={channel}
            index={index}
            getFieldColor={getFieldColor}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}; export default Dashboard;
