import { Box, Flex, Button, Image, Text, HStack, Input } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4}>
      <Flex maxW="7xl" mx="auto" px={8} justify="space-between" align="center">
        <HStack spacing={8}>
          <Link to="/">
            <HStack spacing={3}>
              <Image src="/polymath-logo.svg" h="32px" alt="Polymath Logo" />
              <Box>
                <Text fontSize="lg" fontWeight="semibold" color="navy.800">Polymath</Text>
                <Text fontSize="xs" color="gray.500">Interdisciplinary Network</Text>
              </Box>
            </HStack>
          </Link>
          <Text fontSize="2xl" color="gray.300">|</Text>
          <Box flex={1}>
            <Text fontSize="xl" fontWeight="medium" color="navy.800">Polymath Network</Text>
            <Text fontSize="sm" color="gray.600">Where interdisciplinary minds converge to explore the connections between all fields of knowledge.</Text>
          </Box>
        </HStack>

        <HStack spacing={4}>
          <Input variant="search" placeholder="Search channels, topics, or fields..." w="320px" />
          <Button variant="ghost">My Channels</Button>
          <Button variant="solid">Create Channel</Button>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;
