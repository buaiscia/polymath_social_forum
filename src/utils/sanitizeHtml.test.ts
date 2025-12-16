import { describe, it, expect } from 'vitest';
import { sanitizeRichText } from './sanitizeHtml';

describe('sanitizeRichText links', () => {
  it('preserves safe http links and enforces rel/target attributes', () => {
    const result = sanitizeRichText('<a href="https://example.com">Example</a>');
    expect(result).toContain('href="https://example.com/"');
    expect(result).toContain('rel="noopener noreferrer"');
    expect(result).toContain('target="_blank"');
  });

  it('allows mailto links', () => {
    const result = sanitizeRichText('<a href="mailto:user@example.com">Email</a>');
    expect(result).toContain('href="mailto:user@example.com"');
  });

  it('removes disallowed protocols', () => {
    const result = sanitizeRichText('<a href="javascript:alert(1)">Bad</a>');
    expect(result).toContain('Bad');
    expect(result).not.toContain('<a');
  });
});
