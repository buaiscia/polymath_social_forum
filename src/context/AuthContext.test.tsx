import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';

afterEach(() => {
  vi.restoreAllMocks();
});

const createAxiosError = (message: string): AxiosError<{ message: string }> => ({
  name: 'AxiosError',
  message,
  config: { headers: {} } as InternalAxiosRequestConfig,
  request: {},
  response: {
    data: { message },
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: {} } as InternalAxiosRequestConfig,
  } as AxiosResponse<{ message: string }>,
  isAxiosError: true,
  toJSON: () => ({ message }),
  code: 'ERR_BAD_REQUEST',
});

const RegisterTestHarness = () => {
  const { openRegisterModal, register } = useAuth();
  return (
    <>
      <button onClick={openRegisterModal}>Open Register</button>
      <button
        onClick={() =>
          register({ email: 'weak@example.com', username: 'weakuser', password: 'weakpass' })
        }
      >
        Submit Weak Password
      </button>
    </>
  );
};

const renderWithProvider = () =>
  render(
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <RegisterTestHarness />
      </AuthProvider>
    </ChakraProvider>,
  );

describe('AuthProvider register flow', () => {
  it('surfaces the server validation error when password strength is rejected', async () => {
    const user = userEvent.setup();
    vi.spyOn(axios, 'post').mockRejectedValueOnce(
      createAxiosError('Password must be 8+ chars with upper, lower, number, and symbol.'),
    );

    renderWithProvider();

    await user.click(screen.getByText('Open Register'));
    await user.click(screen.getByText('Submit Weak Password'));

    await waitFor(() => {
      expect(
        screen.getByText('Password must be 8+ chars with upper, lower, number, and symbol.'),
      ).toBeInTheDocument();
    });
  });
});
