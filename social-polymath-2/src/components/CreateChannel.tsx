import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  Tag,
  HStack,
  TagLabel,
  TagCloseButton,
  Heading,
  Text,
  Container,
  Link,
  Icon,
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { FiSettings } from 'react-icons/fi';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const CreateChannel = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const toast = useToast();
  const navigate = useNavigate();

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || tags.length === 0) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields and add at least one tag',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/channels', {
        title,
        description,
        tags,
      });

      toast({
        title: 'Success',
        description: 'Channel created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/');
    } catch (error) {
      console.error('Failed to create channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to create channel',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Back Button */}
        <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
          <HStack spacing={1} color="gray.600" _hover={{ color: 'navy.600' }}>
            <Icon as={ChevronLeftIcon} w={5} h={5} />
            <Text fontSize="md">Back to Channels</Text>
          </HStack>
        </Link>

        {/* Header */}
        <Box>
          <Heading size="xl" color="navy.800" mb={3}>
            Launch Your Channel
          </Heading>
          <Text color="gray.600" fontSize="lg" lineHeight="1.6">
            Create a space where interdisciplinary minds can explore the fascinating connections between different fields of knowledge.
          </Text>
        </Box>

        {/* Create Channel Form */}
        <Box
          as="form"
          onSubmit={handleSubmit}
          bg="white"
          p={8}
          borderRadius="xl"
          boxShadow="sm"
          border="1px solid"
          borderColor="gray.100"
        >
          <VStack spacing={6} align="stretch">
            <HStack spacing={2} mb={2}>
              <Icon as={FiSettings} color="gray.600" />
              <Heading size="md" color="gray.700">
                Create New Channel
              </Heading>
            </HStack>

            <FormControl isRequired>
              <FormLabel color="gray.700" fontWeight="medium">
                Channel Title
              </FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter an engaging title for your channel"
                size="lg"
                bg="yellow.100"
                border="none"
                borderRadius="md"
                _placeholder={{ color: 'gray.600' }}
                _focus={{
                  bg: 'yellow.50',
                  outline: 'none',
                  boxShadow: 'none',
                }}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="gray.700" fontWeight="medium">
                Description
              </FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this channel will explore and discuss..."
                size="lg"
                bg="yellow.100"
                border="none"
                borderRadius="md"
                rows={4}
                _placeholder={{ color: 'gray.600' }}
                _focus={{
                  bg: 'yellow.50',
                  outline: 'none',
                  boxShadow: 'none',
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="gray.700" fontWeight="medium">
                Academic Fields
              </FormLabel>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Type a field (e.g., Biology, Philosophy, Mathematics) and press Enter"
                size="lg"
                bg="yellow.100"
                border="none"
                borderRadius="md"
                _placeholder={{ color: 'gray.600' }}
                _focus={{
                  bg: 'yellow.50',
                  outline: 'none',
                  boxShadow: 'none',
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              {tags.length > 0 && (
                <HStack spacing={2} wrap="wrap" mt={3}>
                  {tags.map((tag, index) => (
                    <Tag
                      key={index}
                      size="md"
                      borderRadius="full"
                      variant="solid"
                      bg="navy.600"
                      color="white"
                    >
                      <TagLabel>{tag}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                    </Tag>
                  ))}
                </HStack>
              )}
            </FormControl>

            <Button
              type="submit"
              bg="gray.500"
              color="white"
              size="lg"
              borderRadius="md"
              _hover={{ bg: 'gray.600' }}
              _focus={{ boxShadow: 'none' }}
              mt={4}
            >
              Create Channel
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default CreateChannel;
