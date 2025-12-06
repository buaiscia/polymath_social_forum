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

export const AuthProvider = ({ children, initialUser = null, hydrateOnMount = true }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [initializing, setInitializing] = useState(() => (
    hydrateOnMount ? initialUser === null : false
  ));

  const loginDisclosure = useDisclosure();
  const registerDisclosure = useDisclosure();

  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [loginForm, setLoginForm] = useState<LoginPayload>({ identifier: '', password: '' });
  const [registerForm, setRegisterForm] = useState<RegisterPayload>({ email: '', username: '', password: '' });

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await axios.post<AuthResponse>('/auth/refresh');
      setUser(data.user);
      return true;
    } catch (error) {
      setUser(null);
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Session refresh failed:', error);
      }
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!hydrateOnMount || initialUser) {
      setInitializing(false);
      return () => {
        cancelled = true;
      };
    }

    const bootstrap = async () => {
      try {
        await refreshSession();
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Initial session refresh failed:', error);
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [hydrateOnMount, initialUser, refreshSession]);

  const extractError = useCallback((error: unknown, fallback: string) => {
    if (isAxiosError(error)) {
      return (error.response?.data as { message?: string } | undefined)?.message || fallback;
    }

    return fallback;
  }, []);

  const handleLogin = useCallback(async (payload: LoginPayload) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const { data } = await axios.post<AuthResponse>('/auth/login', payload);
      setUser(data.user);
      loginDisclosure.onClose();
      setLoginForm({ identifier: '', password: '' });
    } catch (error) {
      setLoginError(extractError(error, 'Unable to login.'));
    } finally {
      setLoginLoading(false);
    }
  }, [extractError, loginDisclosure]);

  const handleRegister = useCallback(async (payload: RegisterPayload) => {
    setRegisterLoading(true);
    setRegisterError(null);
    try {
      const { data } = await axios.post<AuthResponse>('/auth/register', payload);
      setUser(data.user);
      registerDisclosure.onClose();
      setRegisterForm({ email: '', username: '', password: '' });
    } catch (error) {
      setRegisterError(extractError(error, 'Unable to register.'));
    } finally {
      setRegisterLoading(false);
    }
  }, [extractError, registerDisclosure]);

  const logout = useCallback(async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      setUser(null);
      loginDisclosure.onClose();
      registerDisclosure.onClose();
    }
  }, [loginDisclosure, registerDisclosure]);

  const wrappedRefresh = useCallback(async () => {
    try {
      await refreshSession();
    } catch (error) {
      console.warn('Refresh error:', error);
      setUser(null);
    }
  }, [refreshSession]);

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
        initializing,
        login: handleLogin,
        register: handleRegister,
        logout,
        refreshSession: wrappedRefresh,
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

