import { useState, useEffect } from 'react';
import { Box, SimpleGrid, Text, Tag, Heading } from '@chakra-ui/react';
import axios from 'axios';

interface ITag {
  _id: string;
  name: string;
  color: string;
}

interface IChannel {
  _id: string;
  title: string;
  description: string;
  tags: ITag[];
}

const ChannelList = () => {
  const [channels, setChannels] = useState<IChannel[]>([]);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/channels');
        setChannels(response.data);
      } catch (error) {
        console.error('Error fetching channels:', error);
      }
    };

    fetchChannels();
  }, []);

  return (
    <Box>
      <Heading mb={6}>Channels</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {channels.map((channel) => (
          <Box key={channel._id} p={5} shadow="md" borderWidth="1px" borderRadius="md">
            <Heading size="md" mb={2}>{channel.title}</Heading>
            <Text mb={4}>{channel.description}</Text>
            <Box>
              {channel.tags.map((tag) => (
                <Tag
                  key={tag._id}
                  mr={2}
                  mb={2}
                  backgroundColor={tag.color}
                  color="white"
                >
                  {tag.name}
                </Tag>
              ))}
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default ChannelList;
