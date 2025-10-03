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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const toast = useToast();
  const navigate = useNavigate();

  // Predefined academic fields
  const predefinedFields = [
    'Biology', 'Physics', 'Mathematics', 'Philosophy', 'Psychology',
    'Literature', 'Chemistry', 'History', 'Computer Science', 'Sociology',
    'Economics', 'Political Science', 'Anthropology', 'Geography', 'Art',
    'Music', 'Engineering', 'Medicine', 'Law', 'Linguistics', 'Astronomy',
    'Geology', 'Environmental Science', 'Statistics', 'Architecture'
  ];

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);

    // Show suggestions after 3 characters
    if (value.length >= 3) {
      const matches = predefinedFields.filter(field =>
        field.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions(matches.slice(0, 5)); // Show max 5 suggestions
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Add the tag if it doesn't already exist
    if (!tags.includes(suggestion)) {
      setTags([...tags, suggestion]);
    }
    // Clear input and hide suggestions
    setTagInput('');
    setShowSuggestions(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      setShowSuggestions(false);
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

            <FormControl position="relative">
              <FormLabel color="gray.700" fontWeight="medium">
                Academic Fields
              </FormLabel>
              <Box position="relative">
                <Input
                  value={tagInput}
                  onChange={handleTagInputChange}
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

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <Box
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    boxShadow="lg"
                    zIndex={10}
                    mt={1}
                  >
                    {suggestions.map((suggestion, index) => (
                      <Box
                        key={index}
                        p={3}
                        cursor="pointer"
                        _hover={{ bg: 'teal.50' }}
                        borderBottom={index < suggestions.length - 1 ? "1px solid" : "none"}
                        borderBottomColor="gray.100"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <HStack spacing={3} justify="space-between">
                          <HStack spacing={2}>
                            <Box w={2} h={2} bg="teal.400" borderRadius="full" />
                            <Text fontSize="sm" color="teal.600" fontWeight="medium">
                              {suggestion}
                            </Text>
                          </HStack>
                          <Text fontSize="xs" color="gray.500">
                            Use existing field
                          </Text>
                        </HStack>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              {tags.length > 0 && (
                <HStack spacing={2} wrap="wrap" mt={3}>
                  {tags.map((tag, index) => (
                    <Tag
                      key={index}
                      size="md"
                      borderRadius="full"
                      variant="solid"
                      bg="teal.500"
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
