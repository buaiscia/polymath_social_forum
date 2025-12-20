import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, within, waitFor } from '@testing-library/react';
import { renderWithRouter, screen } from '../test/utils';
import SideNav from './SideNav';
import { useAuth } from '../context/useAuth';
import type { AuthContextValue, AuthUser } from '../context/authTypes';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

const mockAuthUser: AuthUser = {
  _id: 'user-1',
  email: 'guest@example.com',
  username: 'GuestUser',
};

const createAuthValue = (overrides: Partial<AuthContextValue> = {}): AuthContextValue => ({
  user: null,
  initializing: false,
  login: vi.fn(async () => {}),
  register: vi.fn(async () => {}),
  logout: vi.fn(async () => {}),
  refreshSession: vi.fn(async () => {}),
  openLoginModal: vi.fn(),
  openRegisterModal: vi.fn(),
  ...overrides,
});

const renderSideNav = (route = '/', overrides: Partial<AuthContextValue> = {}) => {
  mockUseAuth.mockReturnValue(createAuthValue(overrides));
  return renderWithRouter(<SideNav />, route);
};

beforeAll(() => {
  const elementPrototype = Element.prototype as Element & {
    scrollTo?: (options?: ScrollToOptions | number, y?: number) => void;
  };
  if (!elementPrototype.scrollTo) {
    elementPrototype.scrollTo = () => {};
  }
});

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockReset();
});

describe('SideNav permissions', () => {
  it('hides channel creation actions for guests', () => {
    renderSideNav();

    expect(screen.getByRole('link', { name: /explore channels/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /create channel/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /my channels/i })).not.toBeInTheDocument();
  });

  it('shows channel creation actions for authenticated users', () => {
    renderSideNav('/', { user: mockAuthUser });

    expect(screen.getByRole('link', { name: /explore channels/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create channel/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /my channels/i })).toBeInTheDocument();
  });

  it('keeps the Explore Channels button visible for guests', () => {
    renderSideNav();

    expect(screen.getByRole('link', { name: /explore channels/i })).toBeInTheDocument();
  });

  it('keeps the Explore Channels button visible for authenticated users', () => {
    renderSideNav('/', { user: mockAuthUser });

    expect(screen.getByRole('link', { name: /explore channels/i })).toBeInTheDocument();
  });
});

describe('SideNav highlighting', () => {
  it('marks Explore Channels active on root and channel views', () => {
    renderSideNav('/channels/alpha', { user: mockAuthUser });

    expect(screen.getByRole('link', { name: /explore channels/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /create channel/i })).not.toHaveAttribute('aria-current');
  });

  it('marks Create Channel active on the creation route', () => {
    renderSideNav('/create', { user: mockAuthUser });

    expect(screen.getByRole('link', { name: /create channel/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /explore channels/i })).not.toHaveAttribute('aria-current');
  });

  it('marks My Channels active on the dashboard route', () => {
    renderSideNav('/my-channels', { user: mockAuthUser });

    expect(screen.getByRole('link', { name: /my channels/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /explore channels/i })).not.toHaveAttribute('aria-current');
  });
});

describe('SideNav menu actions', () => {
  it('renders the user menu when authenticated', async () => {
    renderSideNav('/', { user: mockAuthUser });

    fireEvent.click(screen.getByLabelText(/account actions/i));
    const menu = await screen.findByRole('menu', { hidden: true });

    expect(within(menu).getByText(/signed in as/i)).toBeInTheDocument();
    expect(within(menu).getByText(mockAuthUser.username)).toBeInTheDocument();
    expect(within(menu).getByText(mockAuthUser.email)).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: /logout/i, hidden: true })).toBeInTheDocument();
  });

  it('displays guest state when not authenticated', async () => {
    renderSideNav();

    fireEvent.click(screen.getByLabelText(/account actions/i));
    const menu = await screen.findByRole('menu', { hidden: true });

    expect(screen.getByText(/guest/i)).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: /login/i })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: /register/i })).toBeInTheDocument();
  });

  it('opens login and register modals when menu items are clicked', async () => {
    const openLoginModal = vi.fn();
    const openRegisterModal = vi.fn();
    renderSideNav('/', { openLoginModal, openRegisterModal });

    fireEvent.click(screen.getByLabelText(/account actions/i));
    let menu = await screen.findByRole('menu', { hidden: true });
    fireEvent.click(within(menu).getByRole('menuitem', { name: /login/i }));
    expect(openLoginModal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText(/account actions/i));
    menu = await screen.findByRole('menu', { hidden: true });
    fireEvent.click(within(menu).getByRole('menuitem', { name: /register/i }));
    expect(openRegisterModal).toHaveBeenCalledTimes(1);
  });

  it('calls logout from the menu when authenticated', async () => {
    const logout = vi.fn(async () => {});
    renderSideNav('/', { user: mockAuthUser, logout });

    fireEvent.click(screen.getByLabelText(/account actions/i));
    const menu = await screen.findByRole('menu', { hidden: true });
    fireEvent.click(within(menu).getByRole('menuitem', { name: /logout/i }));

    expect(logout).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
