import type { ComponentProps } from 'react';
import type { UseDisclosureReturn } from '@chakra-ui/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen, within } from '../test/utils';
import { AuthModals } from './AuthModals';

const buildDisclosure = (overrides?: Partial<UseDisclosureReturn>): UseDisclosureReturn => ({
  isOpen: false,
  onOpen: vi.fn(),
  onClose: vi.fn(),
  onToggle: vi.fn(),
  isControlled: false,
  getButtonProps: vi.fn().mockReturnValue({}),
  getDisclosureProps: vi.fn().mockReturnValue({}),
  ...overrides,
});

type AuthModalsProps = ComponentProps<typeof AuthModals>;

const createProps = (overrides?: Partial<AuthModalsProps>): AuthModalsProps => ({
  loginDisclosure: buildDisclosure({ isOpen: true }),
  registerDisclosure: buildDisclosure(),
  loginForm: { identifier: '', password: '' },
  registerForm: { email: '', username: '', password: '' },
  loginError: null,
  registerError: null,
  loginLoading: false,
  registerLoading: false,
  onLoginFieldChange: vi.fn(),
  onRegisterFieldChange: vi.fn(),
  onLoginSubmit: vi.fn(),
  onRegisterSubmit: vi.fn(),
  ...overrides,
});

const renderAuthModals = (overrides?: Partial<AuthModalsProps>) => {
  const props = createProps(overrides);
  render(<AuthModals {...props} />);
  return props;
};

describe('AuthModals', () => {
  it('renders the login modal fields when opened', () => {
    renderAuthModals({ registerDisclosure: buildDisclosure() });

    const loginDialog = screen.getByRole('dialog', { name: 'Sign in' });
    expect(within(loginDialog).getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(within(loginDialog).getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(within(loginDialog).getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders the register modal form and password helper', () => {
    renderAuthModals({
      loginDisclosure: buildDisclosure(),
      registerDisclosure: buildDisclosure({ isOpen: true }),
    });

    const registerDialog = screen.getByRole('dialog', { name: 'Create an account' });
    expect(within(registerDialog).getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(within(registerDialog).getByPlaceholderText('scholar123')).toBeInTheDocument();
    expect(within(registerDialog).getByPlaceholderText('Strong password')).toBeInTheDocument();
    expect(within(registerDialog).getByText(/Use at least 8 characters/)).toBeInTheDocument();
  });

  it('invokes login field change handlers when inputs update', () => {
    const props = renderAuthModals({ registerDisclosure: buildDisclosure() });

    const loginDialog = screen.getByRole('dialog', { name: 'Sign in' });
    fireEvent.change(within(loginDialog).getByPlaceholderText('you@example.com'), {
      target: { value: 'polymath' },
    });
    fireEvent.change(within(loginDialog).getByPlaceholderText('••••••••'), {
      target: { value: 'secret' },
    });

    expect(props.onLoginFieldChange).toHaveBeenCalledWith('identifier', 'polymath');
    expect(props.onLoginFieldChange).toHaveBeenCalledWith('password', 'secret');
  });

  it('invokes register field change handlers when inputs update', () => {
    const props = renderAuthModals({
      loginDisclosure: buildDisclosure(),
      registerDisclosure: buildDisclosure({ isOpen: true }),
    });

    const registerDialog = screen.getByRole('dialog', { name: 'Create an account' });
    fireEvent.change(within(registerDialog).getByPlaceholderText('you@example.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(within(registerDialog).getByPlaceholderText('scholar123'), {
      target: { value: 'polymath' },
    });

    expect(props.onRegisterFieldChange).toHaveBeenCalledWith('email', 'user@example.com');
    expect(props.onRegisterFieldChange).toHaveBeenCalledWith('username', 'polymath');
  });

  it('fires the login submit callback from the action button', () => {
    const props = renderAuthModals({ registerDisclosure: buildDisclosure() });

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(props.onLoginSubmit).toHaveBeenCalledTimes(1);
  });

  it('fires the register submit callback from the action button', () => {
    const props = renderAuthModals({
      loginDisclosure: buildDisclosure(),
      registerDisclosure: buildDisclosure({ isOpen: true }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(props.onRegisterSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows the register error and updates the strength indicator based on provided state', () => {
    renderAuthModals({
      loginDisclosure: buildDisclosure(),
      registerDisclosure: buildDisclosure({ isOpen: true }),
      registerError: 'Username already taken',
      registerForm: { email: '', username: '', password: 'Abcd1234!' },
    });

    expect(screen.getByText('Username already taken')).toBeInTheDocument();

    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '100');
  });

  it('shows the login error when provided', () => {
    renderAuthModals({ loginError: 'Invalid credentials', registerDisclosure: buildDisclosure() });

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('submits the login form when Enter is pressed inside a field', async () => {
    const props = renderAuthModals({ registerDisclosure: buildDisclosure() });
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('you@example.com'), '{enter}');

    expect(props.onLoginSubmit).toHaveBeenCalledTimes(1);
  });

  it('submits the register form when Enter is pressed inside a field', async () => {
    const props = renderAuthModals({
      loginDisclosure: buildDisclosure(),
      registerDisclosure: buildDisclosure({ isOpen: true }),
    });
    const user = userEvent.setup();

    const registerDialog = screen.getByRole('dialog', { name: 'Create an account' });
    await user.type(within(registerDialog).getByPlaceholderText('you@example.com'), '{enter}');

    expect(props.onRegisterSubmit).toHaveBeenCalledTimes(1);
  });
});
