import {
  VStack,
  Text,
  Button,
  Box,
  HStack,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { FiSearch, FiPlus, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';

const SideNav = () => {
  const { user, logout, openLoginModal, openRegisterModal } = useAuth();

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
          <Text color="gray.500" fontSize="sm" mb={3}>
            Connected Thinker
          </Text>
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Avatar size="sm" name={user?.username} bg="navy.800" color="white" />
              <Text fontWeight="medium">
                {user ? user.username : 'Guest'}
              </Text>
            </HStack>
            <Menu placement="right-start" gutter={12}>
              <Tooltip label={user ? 'Account' : 'Sign in'} placement="right">
                <MenuButton
                  as={IconButton}
                  icon={<FiUser />}
                  variant="ghost"
                  aria-label="Account actions"
                  size="sm"
                />
              </Tooltip>
              <MenuList>
                {user ? (
                  <>
                    <Box px={3} py={2}>
                      <Text fontSize="sm" color="gray.500">
                        Signed in as
                      </Text>
                      <Text fontWeight="semibold">{user.username}</Text>
                      <Text fontSize="sm" color="gray.500">{user.email}</Text>
                    </Box>
                    <Divider my={1} />
                    <MenuItem onClick={logout}>Logout</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem onClick={openLoginModal}>Login</MenuItem>
                    <MenuItem onClick={openRegisterModal}>Register</MenuItem>
                  </>
                )}
              </MenuList>
            </Menu>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default SideNav;
