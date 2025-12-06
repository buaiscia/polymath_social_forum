import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import theme from '../theme';
import { AuthProvider } from '../context/AuthContext';
import type { AuthUser } from '../context/authTypes';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authUser?: AuthUser | null;
  hydrateOnMount?: boolean;
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions,
) => {
  const { authUser = null, hydrateOnMount = false, ...renderOptions } = options ?? {};

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ChakraProvider theme={theme}>
      <AuthProvider initialUser={authUser} hydrateOnMount={hydrateOnMount}>
        {children}
      </AuthProvider>
    </ChakraProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from testing library
export { customRender as render };
export * from '@testing-library/react';

export const renderWithRouter = (ui: ReactElement, route = '/', options?: CustomRenderOptions) => {
  return customRender(
    <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>,
    options,
  );
};
