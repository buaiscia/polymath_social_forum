import sanitizeHtmlLib from 'sanitize-html';

const allowedTags = [
  'p',
  'br',
  'span',
  'strong',
  'em',
  'u',
  's',
  'blockquote',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
];

const allowedAttributes: sanitizeHtmlLib.IOptions['allowedAttributes'] = {
  a: ['href', 'rel', 'target'],
  span: ['style'],
  '*': ['class'],
};

const allowedStyles: sanitizeHtmlLib.IOptions['allowedStyles'] = {
  span: {
    'font-size': [/^(?:0|[1-9]\d*)(?:\.\d+)?rem$/],
  },
};

const allowedSchemes: string[] = ['http', 'https', 'mailto'];

export const sanitizeRichText = (dirty: string) =>
  sanitizeHtmlLib(dirty, {
    allowedTags,
    allowedAttributes,
    allowedStyles,
    allowedSchemes,
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtmlLib.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
    parser: {
      lowerCaseTags: true,
    },
  }).trim();

export const isRichTextEmpty = (html: string) => {
  const sanitized = sanitizeRichText(html);
  const textOnly = sanitized.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
  return textOnly.length === 0;
};
