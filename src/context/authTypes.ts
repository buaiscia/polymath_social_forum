import type { ReactNode } from 'react';

export interface AuthUser {
  _id: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  initializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  openLoginModal: () => void;
  openRegisterModal: () => void;
}

export interface AuthProviderProps {
  children: ReactNode;
  initialUser?: AuthUser | null;
  hydrateOnMount?: boolean;
}
