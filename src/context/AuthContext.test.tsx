import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';

vi.mock('axios');

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
    vi.mocked(axios.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: { message: 'Password must be 8+ chars with upper, lower, number, and symbol.' },
      },
    });

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
