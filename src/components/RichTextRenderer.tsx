import { Box, useColorModeValue } from '@chakra-ui/react';
import type { BoxProps } from '@chakra-ui/react';
import { useMemo } from 'react';
import { sanitizeRichText } from '../utils/sanitizeHtml';

interface RichTextRendererProps extends BoxProps {
  content?: string;
}

export const RichTextRenderer = ({ content, className, sx, ...boxProps }: RichTextRendererProps) => {
  const sanitized = useMemo(() => sanitizeRichText(content || ''), [content]);
  const combinedClassName = ['rich-text-renderer', className].filter(Boolean).join(' ');

  const linkColor = useColorModeValue('purple.700', 'purple.300');
  const codeBackgroundColor = useColorModeValue('gray.100', 'gray.700');
  const blockquoteBorderColor = useColorModeValue('purple.400', 'purple.500');
  const blockquoteTextColor = useColorModeValue('navy.700', 'gray.300');

  return (
    <Box
      {...boxProps}
      className={combinedClassName}
      sx={{
        '& em': { fontStyle: 'italic' },
        '& strong': { fontWeight: 600 },
        '& u': { textDecoration: 'underline' },
        '& a': {
          color: linkColor,
          textDecoration: 'underline',
          fontWeight: 500,
        },
        '& h1': {
          fontSize: '1.6rem',
          fontWeight: 600,
          margin: '1.25rem 0 0.35rem',
          lineHeight: 1.25,
        },
        '& h2': {
          fontSize: '1.4rem',
          fontWeight: 600,
          margin: '1rem 0 0.3rem',
          lineHeight: 1.3,
        },
        '& h3': {
          fontSize: '1.2rem',
          fontWeight: 600,
          margin: '0.85rem 0 0.25rem',
          lineHeight: 1.35,
        },
        '& h4': {
          fontSize: '1.1rem',
          fontWeight: 600,
          margin: '0.75rem 0 0.2rem',
          lineHeight: 1.4,
        },
        '& h5': {
          fontSize: '1.05rem',
          fontWeight: 600,
          margin: '0.6rem 0 0.2rem',
          lineHeight: 1.4,
        },
        '& h6': {
          fontSize: '1rem',
          fontWeight: 600,
          margin: '0.5rem 0 0.15rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        },
        '& code': {
          fontFamily: 'Menlo, Consolas, monospace',
          fontSize: '0.95em',
          padding: '0 0.25em',
          backgroundColor: codeBackgroundColor,
          borderRadius: '0.25rem',
        },
        '& blockquote': {
          borderLeft: `4px solid`,
          borderColor: blockquoteBorderColor,
          paddingLeft: '0.75rem',
          color: blockquoteTextColor,
          margin: '0.75rem 0',
        },
        ...sx,
      }}
      dangerouslySetInnerHTML={{ __html: sanitized || '<p></p>' }}
    />
  );
};

export default RichTextRenderer;
