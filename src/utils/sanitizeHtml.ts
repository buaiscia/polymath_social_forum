import sanitizeHtmlLib from 'sanitize-html';
import isEmail from 'validator/lib/isEmail';

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
const linkTransform = sanitizeHtmlLib.simpleTransform('a', {
  rel: 'noopener noreferrer',
  target: '_blank',
});
const extractPlainText = (html: string) =>
  html
    .replace(/<br\s*\/?>(?=\s|$)/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeHref = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.toLowerCase().startsWith('mailto:')) {
    const email = trimmed.slice(7);
    return isValidEmailAddress(email) ? `mailto:${email}` : null;
  }
  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch (error) {
    return null;
  }
};

export const isValidEmailAddress = (value: string) => {
  if (!value) {
    return false;
  }
  return isEmail(value.trim(), {
    allow_utf8_local_part: false,
    ignore_max_length: false,
  });
};

export const sanitizeRichText = (dirty: string) => {
  const sanitized = sanitizeHtmlLib(dirty, {
    allowedTags,
    allowedAttributes,
    allowedStyles,
    allowedSchemes,
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const safeHref = normalizeHref(attribs.href);
        if (!safeHref) {
          return 'span';
        }
        return linkTransform(tagName, { ...attribs, href: safeHref });
      },
    },
    parser: {
      lowerCaseTags: true,
    },
  }).trim();
  if (!sanitized) {
    return '';
  }
  return extractPlainText(sanitized) ? sanitized : '';
};

export const getPlainTextFromHtml = (html: string) =>
  extractPlainText(sanitizeRichText(html));

export const isRichTextEmpty = (html: string) => sanitizeRichText(html) === '';
