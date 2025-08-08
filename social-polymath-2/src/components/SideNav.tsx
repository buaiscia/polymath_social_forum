import { VStack, Text, Button, Box, HStack, Icon } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { FiSearch, FiPlus, FiUser } from 'react-icons/fi';

const SideNav = () => {
  return (
    <Box w="280px" p={6} bg="white" borderRight="1px" borderColor="gray.200" h="calc(100vh - 76px)" position="fixed" left={0} top="76px">
      <VStack spacing={6} align="stretch">
        <Box>
          <Text color="gray.600" fontWeight="medium" mb={4}>
            NAVIGATE
          </Text>
          <VStack spacing={2} align="stretch">
            <Button
              as={Link}
              to="/"
              variant="ghost"
              justifyContent="flex-start"
              leftIcon={<Icon as={FiSearch} />}
              bg="navy.800"
              color="white"
              _hover={{ bg: 'navy.700' }}
            >
              Explore Channels
            </Button>
            <Button
              as={Link}
              to="/create"
              variant="ghost"
              justifyContent="flex-start"
              leftIcon={<Icon as={FiPlus} />}
              color="gray.700"
              _hover={{ bg: 'gray.100' }}
            >
              Create Channel
            </Button>
            <Button
              as={Link}
              to="/my-channels"
              variant="ghost"
              justifyContent="flex-start"
              leftIcon={<Icon as={FiUser} />}
              color="gray.700"
              _hover={{ bg: 'gray.100' }}
            >
              My Channels
            </Button>
          </VStack>
        </Box>

        <Box pt={4}>
          <Text color="gray.500" fontSize="sm">
            Connected Thinker
          </Text>
          <HStack mt={3} spacing={3}>
            <Box w={8} h={8} borderRadius="full" bg="gray.200" />
            <Text fontWeight="medium">Scholar</Text>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default SideNav;
