import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

vi.mock('@tiptap/react', async () => {
  const actual = await vi.importActual<typeof import('@tiptap/react')>('@tiptap/react');
  return {
    ...actual,
    useEditor: () => null,
    EditorContent: (props: ComponentProps<typeof actual.EditorContent>) => (
      <div data-testid="editor-content" {...props} />
    ),
  };
});

import RichTextEditor from './RichTextEditor';

describe('RichTextEditor keyboard shortcuts', () => {
  beforeAll(() => {
    vi.stubEnv('VITEST', '');
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  const renderEditor = () =>
    render(
      <RichTextEditor
        value=""
        onChange={vi.fn()}
        placeholder="Type something"
        ariaLabel="Rich text composer"
      />,
    );

  it.each([
    { label: 'Bold', shortcut: 'Control+B Meta+B' },
    { label: 'Italic', shortcut: 'Control+I Meta+I' },
    { label: 'Underline', shortcut: 'Control+U Meta+U' },
  ])('exposes $label shortcut metadata', ({ label, shortcut }) => {
    renderEditor();
    const button = screen.getByRole('button', { name: label });
    expect(button).toHaveAttribute('aria-keyshortcuts', shortcut);
  });

  it('renders the link control even without an editor instance', () => {
    renderEditor();
    expect(screen.getByRole('button', { name: /insert link/i })).toBeDisabled();
  });
});
