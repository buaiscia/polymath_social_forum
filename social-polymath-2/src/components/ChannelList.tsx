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

  return (
    <Box maxW="7xl" mx="auto" px={8} py={6}>
      <VStack spacing={8} align="stretch">
        <HStack spacing={4}>
          <Text fontWeight="medium" color="gray.600">Filter by field:</Text>
          <Button variant="solid" bg="navy.800" color="white">All Fields</Button>
          <Button variant="academic" field="biology">Biology</Button>
          <Button variant="academic" field="physics">Physics</Button>
          <Button variant="academic" field="mathematics">Mathematics</Button>
          <Button variant="academic" field="philosophy">Philosophy</Button>
          <Button variant="academic" field="psychology">Psychology</Button>
        </HStack>

        <HStack spacing={4}>
          <Button variant="academic" field="literature">Literature</Button>
          <Button variant="academic" field="chemistry">Chemistry</Button>
          <Button variant="academic" field="history">History</Button>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
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
                        variant="academic"
                        field={field}
                      >
                        {field}
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
  //   { tag.name }
  //                 </Tag >
  //               ))}
  //             </Box >
  //           </Box >
  //         ))}
  //       </SimpleGrid >
  //     </Box >
  //   );
};

export default ChannelList;
