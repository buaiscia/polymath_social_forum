import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';

// Custom render function that includes ChakraProvider
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider theme={theme}>{children}</ChakraProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Re-export everything from testing library
export { customRender as render };
export * from '@testing-library/react';
