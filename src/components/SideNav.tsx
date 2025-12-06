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
  Portal,
} from '@chakra-ui/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';

const SideNav = () => {
  const { user, logout, openLoginModal, openRegisterModal } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isExploreActive = location.pathname === '/' || location.pathname.startsWith('/channels');
  const isCreateActive = location.pathname === '/create';
  const isMyChannelsActive = location.pathname === '/my-channels';

  const activeButtonStyles = {
    bg: 'navy.800',
    color: 'white',
    _hover: { bg: 'navy.700' },
  } as const;

  const inactiveButtonStyles = {
    color: 'gray.700',
    _hover: { bg: 'gray.100' },
  } as const;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Box w="280px" p={6} bg="white" borderRight="1px" borderColor="gray.200" h="calc(100vh - 76px)" position="fixed" left={0}>
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
              aria-current={isExploreActive ? 'page' : undefined}
              {...(isExploreActive ? activeButtonStyles : inactiveButtonStyles)}
            >
              Explore Channels
            </Button>
            {user && (
              <>
                <Button
                  as={Link}
                  to="/create"
                  variant="ghost"
                  justifyContent="flex-start"
                  leftIcon={<Icon as={FiPlus} />}
                  aria-current={isCreateActive ? 'page' : undefined}
                  {...(isCreateActive ? activeButtonStyles : inactiveButtonStyles)}
                >
                  Create Channel
                </Button>
                <Button
                  as={Link}
                  to="/my-channels"
                  variant="ghost"
                  justifyContent="flex-start"
                  leftIcon={<Icon as={FiUser} />}
                  aria-current={isMyChannelsActive ? 'page' : undefined}
                  {...(isMyChannelsActive ? activeButtonStyles : inactiveButtonStyles)}
                >
                  My Channels
                </Button>
              </>
            )}
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
              <Portal>
                <MenuList zIndex="popover">
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
                      <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </>
                  ) : (
                    <>
                      <MenuItem onClick={openLoginModal}>Login</MenuItem>
                      <MenuItem onClick={openRegisterModal}>Register</MenuItem>
                    </>
                  )}
                </MenuList>
              </Portal>
            </Menu>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default SideNav;
