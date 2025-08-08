import { useState } from 'react';
import { Box, SimpleGrid, Text, Button, Heading, HStack, VStack, Icon, Flex } from '@chakra-ui/react';
import { FiFilter } from 'react-icons/fi';

interface Channel {
  id: string;
  title: string;
  description: string;
  fields: string[];
  memberCount: number;
}

const sampleChannels: Channel[] = [
  {
    id: '1',
    title: 'Consciousness & Quantum Mechanics',
    description: 'Exploring the mysterious intersection between quantum physics and consciousness.',
    fields: ['physics', 'psychology'],
    memberCount: 127
  },
  {
    id: '2',
    title: 'Evolution of Language & Thought',
    description: 'How did language shape human cognition, and how does cognition shape language?',
    fields: ['psychology', 'history'],
    memberCount: 89
  },
  {
    id: '3',
    title: 'Mathematical Beauty in Nature',
    description: 'From the Fibonacci sequence in flower petals to fractals in coastlines.',
    fields: ['mathematics', 'biology'],
    memberCount: 156
  }
];

const ChannelList = () => {
  const [channels] = useState<Channel[]>(sampleChannels);

  const getFieldColor = (field: string) => `academic.${field}`;

  return (
    <Box px={12} py={8}>
      <VStack spacing={10} align="stretch">
        <VStack spacing={6} align="stretch">
          <HStack spacing={4}>
            <Icon as={FiFilter} color="gray.600" />
            <Text fontWeight="medium" color="gray.600">Filter by field:</Text>
          </HStack>
          
          <VStack spacing={4} align="stretch">
            <HStack spacing={4} wrap="wrap">
              <Button 
                bg="navy.800" 
                color="white" 
                size="md"
                _hover={{ bg: 'navy.700' }}
              >
                All Fields
              </Button>
              {[
                'biology',
                'physics',
                'mathematics',
                'philosophy',
                'psychology'
              ].map((field) => (
                <Button 
                  key={field}
                  bg={getFieldColor(field)}
                  color="white" 
                  size="md"
                  _hover={{ opacity: 0.9 }}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </Button>
              ))}
            </HStack>

            <HStack spacing={4} wrap="wrap">
              {[
                'literature',
                'chemistry',
                'history'
              ].map((field) => (
                <Button 
                  key={field}
                  bg={getFieldColor(field)}
                  color="white"
                  _hover={{ opacity: 0.9 }}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </Button>
              ))}
            </HStack>
          </VStack>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
          {channels.map((channel) => (
            <Box
              key={channel.id}
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
                <Heading size="md" color="navy.800">{channel.title}</Heading>
                <Text color="gray.600" flex="1">
                  {channel.description}
                </Text>
                <Flex justify="space-between" align="center">
                  <HStack spacing={2}>
                    {channel.fields.map((field) => (
                      <Button
                        key={field}
                        size="sm"
                        bg={getFieldColor(field)}
                        color="white"
                        borderRadius="full"
                        _hover={{ opacity: 0.9 }}
                      >
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </Button>
                    ))}
                  </HStack>
                  <HStack spacing={1}>
                    <Text fontWeight="medium">{channel.memberCount}</Text>
                    <Text color="gray.500">members</Text>
                  </HStack>
                </Flex>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default ChannelList;
