import {
  Box,
  Button,
  Heading,
  HStack,
  VStack,
  Icon,
  Text,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiFilter } from 'react-icons/fi';

interface Tag {
  _id: string;
  name: string;
  color: string;
}

interface Channel {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  tags: Tag[];
  memberCount?: number;
}

interface ChannelCardProps {
  channel: Channel;
  getFieldColor: (field: string) => string;
}

const ChannelCard = ({ channel, getFieldColor }: ChannelCardProps) => {
  const channelId = channel._id || channel.id;

  const cardContent = (
    <VStack align="stretch" h="full" spacing={4}>
      <Heading size="md" color="gray.800" lineHeight="1.3" fontWeight="600">
        {channel.title}
      </Heading>

      <Text color="gray.600" flex="1" fontSize="sm" lineHeight="1.6">
        {channel.description}
      </Text>

      {channel.tags && channel.tags.length > 0 && (
        <HStack spacing={2} wrap="wrap">
          {channel.tags.map((tag, tagIndex) => (
            <Button
              key={tag._id || `tag-${tagIndex}`}
              size="sm"
              bg={tag.color || getFieldColor(tag.name)}
              color="white"
              borderRadius="full"
              fontSize="xs"
              px={3}
              py={1}
              _hover={{ opacity: 0.9 }}
              pointerEvents="none"
            >
              {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
            </Button>
          ))}
        </HStack>
      )}

      <HStack justify="space-between" align="center">
        <HStack spacing={1} fontSize="sm" color="gray.500">
          <Icon as={FiFilter} w={4} h={4} />
          <Text fontWeight="medium">{channel.memberCount || 1}</Text>
          <Text>members</Text>
        </HStack>

        <HStack spacing={1}>
          <Icon as={FiFilter} w={4} h={4} color="gray.400" />
          <Button
            variant="ghost"
            size="sm"
            color="gray.600"
            fontSize="sm"
            fontWeight="normal"
            p={0}
            h="auto"
            _hover={{ color: 'navy.600' }}
          >
            Join Discussion
          </Button>
        </HStack>
      </HStack>
    </VStack>
  );

  if (!channelId) {
    return (
      <Box
        as="article"
        bg="white"
        borderRadius="xl"
        boxShadow="sm"
        p={6}
        transition="all 0.2s"
      >
        {cardContent}
      </Box>
    );
  }

  return (
    <Box
      as={RouterLink}
      to={`/channels/${channelId}`}
      textDecoration="none"
      bg="white"
      borderRadius="xl"
      boxShadow="sm"
      p={6}
      transition="all 0.2s"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'md',
      }}
    >
      {cardContent}
    </Box>
  );
};

export default ChannelCard;
