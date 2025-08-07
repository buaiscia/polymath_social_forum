import { Box, Flex, Button } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <Box bg="gray.800" color="white" px={4} py={3}>
      <Flex maxW="container.xl" mx="auto" justify="space-between" align="center">
        <Link to="/">
          <Box fontSize="xl" fontWeight="bold">Social Polymath</Box>
        </Link>
        <Link to="/create">
          <Button colorScheme="teal">Create Channel</Button>
        </Link>
      </Flex>
    </Box>
  );
};

export default Navbar;
