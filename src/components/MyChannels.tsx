import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import ChannelCard, { type ChannelSummary } from './ChannelCard';
import { useAuth } from '../context/useAuth';
import { useMyChannels } from '../hooks/useMyChannels';
import { useUserDirectory } from '../hooks/useUserDirectory';

const getFieldColor = (field: string) => `academic.${field}`;

interface SectionProps {
  title: string;
  channels: ChannelSummary[];
  emptyMessage: string;
  resolveCreatorName: (channel: ChannelSummary) => string | undefined;
}

const ChannelSection = ({ title, channels, emptyMessage, resolveCreatorName }: SectionProps) => {
  if (!channels.length) {
    return (
      <VStack align="stretch" spacing={3} bg="white" borderRadius="lg" p={6} borderWidth="1px" borderColor="gray.100">
        <Heading size="sm" color="gray.700">{title}</Heading>
        <Text color="gray.500" fontSize="sm">
          {emptyMessage}
        </Text>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md" color="gray.800">{title}</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
        {channels.map((channel) => (
          <ChannelCard
            key={channel._id || channel.id}
            channel={channel}
            getFieldColor={getFieldColor}
            creatorName={resolveCreatorName(channel)}
          />
        ))}
      </SimpleGrid>
    </VStack>
  );
};

const MyChannels = () => {
  const { user, openLoginModal, openRegisterModal } = useAuth();
  const isAuthenticated = Boolean(user);
  const { createdChannels, participatedChannels, isLoading, error, refetch } = useMyChannels(isAuthenticated);
  const { usersById } = useUserDirectory(isAuthenticated);

  const resolveCreatorName = (channel: ChannelSummary) => {
    if (!isAuthenticated) return undefined;
    const { creator } = channel;
    if (!creator) return undefined;
    if (typeof creator === 'string') {
      return usersById[creator]?.username;
    }
    return creator.username;
  };

  if (!isAuthenticated) {
    return (
      <Box px={{ base: 4, md: 12 }} py={12}>
        <VStack align="stretch" spacing={6} bg="white" borderRadius="xl" boxShadow="sm" p={{ base: 6, md: 10 }}>
          <Heading size="lg" color="navy.800">My Channels</Heading>
          <Text color="gray.600" fontSize="md">
            Sign in to see the channels you created and the conversations you joined.
          </Text>
          <HStack spacing={4}>
            <Button colorScheme="navy" bg="navy.700" color="white" onClick={openLoginModal}>
              Login
            </Button>
            <Button variant="outline" colorScheme="navy" onClick={openRegisterModal}>
              Create Account
            </Button>
          </HStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Box px={{ base: 4, md: 12 }} py={10}>
      <VStack align="stretch" spacing={8}>
        <VStack align="flex-start" spacing={3}>
          <Heading size="lg" color="navy.800">
            Your Channels
          </Heading>
          <Text color="gray.600">
            A clear view of everything you launched and conversations where you contributed.
          </Text>
        </VStack>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
            <Button ml={4} size="sm" onClick={refetch}>
              Try again
            </Button>
          </Alert>
        )}

        {isLoading ? (
          <VStack spacing={4} py={20}>
            <Spinner size="lg" color="navy.600" />
            <Text color="gray.600">Loading your channels...</Text>
          </VStack>
        ) : (
          <VStack align="stretch" spacing={10}>
            <ChannelSection
              title="Created Channels"
              channels={createdChannels}
              emptyMessage="You haven't created any channels yet. Start one from the Create Channel page."
              resolveCreatorName={resolveCreatorName}
            />
            <ChannelSection
              title="Participated Channels"
              channels={participatedChannels}
              emptyMessage="Join a conversation to see it listed here."
              resolveCreatorName={resolveCreatorName}
            />
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default MyChannels;
