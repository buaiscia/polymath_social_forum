import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    navy: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',  // primary navy
      900: '#0f172a',
    },
    academic: {
      biology: '#10b981',    // lighter emerald
      physics: '#fbbf24',    // warmer amber
      mathematics: '#60a5fa', // bright blue
      philosophy: '#a78bfa',  // bright violet
      psychology: '#7e22ce',  // deeper purple
      literature: '#ec4899',  // pink
      chemistry: '#06b6d4',   // cyan
      history: '#ef4444',     // red
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    white: '#ffffff'
  },
  fonts: {
    heading: 'Spectral, Georgia, serif',
    body: 'Inter, system-ui, sans-serif',
  },
  styles: {
    global: {
      'html, body': {
        bg: 'gray.50',
        color: 'navy.800',
        minHeight: '100vh',
      },
      body: {
        lineHeight: 'tall',
      },
      'h1, h2, h3, h4, h5, h6': {
        color: 'navy.800',
        letterSpacing: '-0.02em',
        fontWeight: '600',
        lineHeight: 'shorter',
      },
      'button, input, textarea': {
        fontSize: 'sm',
      },
      '.chakra-button': {
        fontWeight: 'medium',
      }
    },
  },
  components: {
    Button: {
      variants: {
        ghost: {
          color: 'gray.600',
          _hover: {
            bg: 'gray.100',
          }
        },
        solid: {
          bg: 'navy.800',
          color: 'white',
          _hover: {
            bg: 'navy.700',
          }
        },
        academic: (props: { field: string }) => ({
          bg: `academic.${props.field}`,
          color: 'white',
          fontWeight: 'medium',
          borderRadius: 'full',
          px: '4',
          _hover: {
            opacity: 0.9,
          }
        })
      }
    },
    Input: {
      variants: {
        search: {
          field: {
            bg: 'white',
            border: '1px solid',
            borderColor: 'gray.200',
            borderRadius: 'full',
            px: '6',
            _focus: {
              borderColor: 'navy.300',
              boxShadow: 'none',
            }
          }
        }
      }
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'xl',
          boxShadow: 'sm',
          p: '6',
          transition: 'all 0.2s',
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow: 'md',
          }
        }
      }
    },
    Container: {
      baseStyle: {
        maxW: '7xl',
        px: { base: 4, md: 8 },
        py: { base: 4, md: 8 },
      }
    },
  },
});

export default theme;
