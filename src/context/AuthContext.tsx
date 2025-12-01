import { useCallback, useEffect, useState } from 'react';
import axios, { isAxiosError } from 'axios';
import { useDisclosure } from '@chakra-ui/react';
import type {
  AuthResponse,
  AuthProviderProps,
  LoginPayload,
  RegisterPayload,
  AuthUser,
} from './authTypes';
import { AuthContext } from './AuthContextState';
import { AuthModals } from '../components/AuthModals';

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
  }, [loginDisclosure, persistSession]);

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
  }, [persistSession, registerDisclosure]);

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

  const updateLoginForm = useCallback((field: keyof LoginPayload, value: string) => {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateRegisterForm = useCallback((field: keyof RegisterPayload, value: string) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
  }, []);

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
      <AuthModals
        loginDisclosure={loginDisclosure}
        registerDisclosure={registerDisclosure}
        loginForm={loginForm}
        registerForm={registerForm}
        loginError={loginError}
        registerError={registerError}
        loginLoading={loginLoading}
        registerLoading={registerLoading}
        onLoginFieldChange={updateLoginForm}
        onRegisterFieldChange={updateRegisterForm}
        onLoginSubmit={() => handleLogin(loginForm)}
        onRegisterSubmit={() => handleRegister(registerForm)}
      />
    </AuthContext.Provider>
  );
};

