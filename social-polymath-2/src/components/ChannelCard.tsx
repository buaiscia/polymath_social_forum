import {
  Box,
  Button,
  Heading,
  HStack,
  VStack,
  Icon,
  Text,
} from '@chakra-ui/react';
import { FiFilter } from 'react-icons/fi';

interface Channel {
  id: string;
  title: string;
  description: string;
  tags: string[];
  memberCount?: number;
}

interface ChannelListProps {
  channel: Channel;
  index: number;
  getFieldColor: (field: string) => string;
}

const ChannelList = ({ channel, index, getFieldColor }: ChannelListProps) => {
  return (
    <Box
      key={channel.id || `channel-${index}`}
      as="article"
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
      <VStack align="stretch" h="full" spacing={4}>
        {/* Tags at the top */}
        {channel.tags && channel.tags.length > 0 && (
          <Box>
            {(() => {
              const tagText = typeof channel.tags[0] === 'string' ? channel.tags[0] : String(channel.tags[0]);
              return (
                <Button
                  size="sm"
                  bg={getFieldColor(tagText)}
                  color="white"
                  borderRadius="full"
                  fontSize="xs"
                  px={3}
                  py={1}
                  _hover={{ opacity: 0.9 }}
                  pointerEvents="none"
                >
                  {tagText.charAt(0).toUpperCase() + tagText.slice(1)}
                </Button>
              );
            })()}
          </Box>
        )}

        {/* Title */}
        <Heading size="md" color="gray.800" lineHeight="1.3" fontWeight="600">
          {channel.title}
        </Heading>

        {/* Description */}
        <Text color="gray.600" flex="1" fontSize="sm" lineHeight="1.6">
          {channel.description}
        </Text>

        {/* Bottom section with member count and join button side by side */}
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
    </Box>
  );
};

export default ChannelList;
