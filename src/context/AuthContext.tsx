import { useCallback, useEffect, useState } from 'react';
import axios, { isAxiosError } from 'axios';
import {
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Text,
  Progress,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import type {
  AuthResponse,
  AuthProviderProps,
  LoginPayload,
  RegisterPayload,
  AuthUser,
} from './authTypes';
import { AuthContext } from './AuthContextState';

const AUTH_STORAGE_KEY = 'psf-auth-session';

const setAuthHeader = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
};

const getStoredSession = () => {
  const raw = typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_STORAGE_KEY) : null;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    return null;
  }
};

const storeSession = (session: AuthResponse | null) => {
  if (typeof window === 'undefined') return;
  if (session) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

const passwordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/[a-z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 15;
  if (/[^\w\s]/.test(password)) score += 15;
  return Math.min(score, 100);
};

export const AuthProvider = ({ children, initialUser = null, initialAccessToken = null }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [accessToken, setAccessToken] = useState<string | null>(initialAccessToken);
  const [initializing, setInitializing] = useState(true);

  const loginDisclosure = useDisclosure();
  const registerDisclosure = useDisclosure();

  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [loginForm, setLoginForm] = useState<LoginPayload>({ identifier: '', password: '' });
  const [registerForm, setRegisterForm] = useState<RegisterPayload>({ email: '', username: '', password: '' });

  const persistSession = useCallback((session: AuthResponse | null) => {
    if (session) {
      setUser(session.user);
      setAccessToken(session.accessToken);
      setAuthHeader(session.accessToken);
    } else {
      setUser(null);
      setAccessToken(null);
      setAuthHeader(null);
    }
    storeSession(session);
  }, []);

  useEffect(() => {
    if (initialUser && initialAccessToken) {
      persistSession({ user: initialUser, accessToken: initialAccessToken });
      setInitializing(false);
      return;
    }

    const existing = getStoredSession();
    if (existing) {
      persistSession(existing);
    }
    setInitializing(false);
  }, [initialAccessToken, initialUser, persistSession]);

  const extractError = (error: unknown, fallback: string) => {
    if (isAxiosError(error)) {
      return (error.response?.data as { message?: string } | undefined)?.message || fallback;
    }
    return fallback;
  };

  const handleLogin = useCallback(async (payload: LoginPayload) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const { data } = await axios.post<AuthResponse>('/auth/login', payload);
      persistSession(data);
      loginDisclosure.onClose();
      setLoginForm({ identifier: '', password: '' });
    } catch (error) {
      setLoginError(extractError(error, 'Unable to login.'));
    } finally {
      setLoginLoading(false);
    }
  }, [persistSession]);

  const handleRegister = useCallback(async (payload: RegisterPayload) => {
    setRegisterLoading(true);
    setRegisterError(null);
    try {
      const { data } = await axios.post<AuthResponse>('/auth/register', payload);
      persistSession(data);
      registerDisclosure.onClose();
      setRegisterForm({ email: '', username: '', password: '' });
    } catch (error) {
      setRegisterError(extractError(error, 'Unable to register.'));
    } finally {
      setRegisterLoading(false);
    }
  }, [persistSession]);

  const logout = useCallback(async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      persistSession(null);
      loginDisclosure.onClose();
      registerDisclosure.onClose();
    }
  }, [loginDisclosure, registerDisclosure, persistSession]);

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await axios.post<AuthResponse>('/auth/refresh');
      persistSession(data);
    } catch (error) {
      console.warn('Refresh error:', error);
      persistSession(null);
    }
  }, [persistSession]);

  const openLoginModal = useCallback(() => {
    setLoginError(null);
    loginDisclosure.onOpen();
  }, [loginDisclosure]);

  const openRegisterModal = useCallback(() => {
    setRegisterError(null);
    registerDisclosure.onOpen();
  }, [registerDisclosure]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        initializing,
        login: handleLogin,
        register: handleRegister,
        logout,
        refreshSession,
        openLoginModal,
        openRegisterModal,
      }}
    >
      {children}
      <Modal isOpen={loginDisclosure.isOpen} onClose={loginDisclosure.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sign in</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Email or username</FormLabel>
                <Input
                  value={loginForm.identifier}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, identifier: event.target.value }))}
                  placeholder="you@example.com"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="••••••••"
                />
              </FormControl>
              {loginError && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {loginError}
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={loginDisclosure.onClose}>
              Cancel
            </Button>
            <Button colorScheme="navy" onClick={() => handleLogin(loginForm)} isLoading={loginLoading}>
              Sign in
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={registerDisclosure.isOpen} onClose={registerDisclosure.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create an account</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="you@example.com"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  value={registerForm.username}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder="scholar123"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Strong password"
                />
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Use at least 8 characters with upper & lower case, a number and a symbol.
                </Text>
                <Progress mt={2} value={passwordStrength(registerForm.password)} size="sm" colorScheme="navy" />
              </FormControl>
              {registerError && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {registerError}
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={registerDisclosure.onClose}>
              Cancel
            </Button>
            <Button colorScheme="navy" onClick={() => handleRegister(registerForm)} isLoading={registerLoading}>
              Create account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AuthContext.Provider>
  );
};

