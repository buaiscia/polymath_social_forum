import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { Editor } from '@tiptap/react';

import RichTextEditor from './RichTextEditor';

describe('RichTextEditor integration', () => {
  it('renders the TipTap editor and propagates user input', async () => {
    const handleChange = vi.fn();
    let editorInstance: Editor | null = null;

    render(
      <RichTextEditor
        value="<p></p>"
        onChange={handleChange}
        placeholder="Share something insightful"
        ariaLabel="Message body"
        onEditorCreated={(editor) => {
          editorInstance = editor;
        }}
      />,
    );

    await waitFor(() => {
      expect(editorInstance).not.toBeNull();
    });

    act(() => {
      editorInstance?.commands.setContent('<p>Hello world</p>');
    });

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
      const lastCall = handleChange.mock.calls.at(-1);
      expect(lastCall?.[0]).toBe('<p>Hello world</p>');
    });

    expect(screen.getByLabelText('Message body').textContent).toContain('Hello world');
  });
});
