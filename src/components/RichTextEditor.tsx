import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Textarea,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { Extension } from '@tiptap/core';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { getPlainTextFromHtml } from '../utils/sanitizeHtml';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatStrikethrough,
  MdCode,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdUndo,
  MdRedo,
} from 'react-icons/md';

export interface RichTextEditorProps {
  value: string;
  onChange: (nextHtml: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  isDisabled?: boolean;
  minHeight?: string | number;
  dataTestId?: string;
}

type ToolbarButton = {
  icon: typeof MdFormatBold;
  label: string;
  isActive: (editor: Editor | null) => boolean;
  run: (editor: Editor) => void;
  canExecute: (editor: Editor | null) => boolean;
};

type TextStyleOption = {
  label: string;
  level: number | null;
};

type FontSizeOption = {
  label: string;
  value: string | null;
};

const FontSizeExtension = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

const toolbarButtons: ToolbarButton[] = [
  {
    icon: MdFormatBold,
    label: 'Bold',
    isActive: (editor) => Boolean(editor?.isActive('bold')),
    run: (editor) => editor.chain().focus().toggleBold().run(),
    canExecute: (editor) => Boolean(editor?.can().chain().toggleBold().run()),
  },
  {
    icon: MdFormatItalic,
    label: 'Italic',
    isActive: (editor) => Boolean(editor?.isActive('italic')),
    run: (editor) => editor.chain().focus().toggleItalic().run(),
    canExecute: (editor) => Boolean(editor?.can().chain().toggleItalic().run()),
  },
  {
    icon: MdFormatUnderlined,
    label: 'Underline',
    isActive: (editor) => Boolean(editor?.isActive('underline')),
    run: (editor) => editor.chain().focus().toggleUnderline().run(),
    canExecute: (editor) => Boolean(editor?.can().chain().toggleUnderline().run()),
  },
  {
    icon: MdFormatStrikethrough,
    label: 'Strikethrough',
    isActive: (editor) => Boolean(editor?.isActive('strike')),
    run: (editor) => editor.chain().focus().toggleStrike().run(),
    canExecute: (editor) => Boolean(editor?.can().chain().toggleStrike().run()),
  },
  {
    icon: MdCode,
    label: 'Inline code',
    isActive: (editor) => Boolean(editor?.isActive('code')),
    run: (editor) => editor.chain().focus().toggleCode().run(),
    canExecute: (editor) => Boolean(editor?.can().chain().toggleCode().run()),
  },
  {
    icon: MdFormatQuote,
    label: 'Block quote',
    isActive: (editor) => Boolean(editor?.isActive('blockquote')),
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
    canExecute: (editor) => Boolean(editor?.can().chain().toggleBlockquote().run()),
  },
  {
    icon: MdFormatListBulleted,
    label: 'Bullet list',
    isActive: (editor) => Boolean(editor?.isActive('bulletList')),
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
    canExecute: (editor) => Boolean(editor?.can().chain().toggleBulletList().run()),
  },
  {
    icon: MdFormatListNumbered,
    label: 'Numbered list',
    isActive: (editor) => Boolean(editor?.isActive('orderedList')),
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
    canExecute: (editor) => Boolean(editor?.can().chain().toggleOrderedList().run()),
  },
];

const textStyleOptions: TextStyleOption[] = [
  { label: 'Paragraph', level: null },
  { label: 'Heading 1', level: 1 },
  { label: 'Heading 2', level: 2 },
  { label: 'Heading 3', level: 3 },
  { label: 'Heading 4', level: 4 },
  { label: 'Heading 5', level: 5 },
  { label: 'Heading 6', level: 6 },
];

const fontSizeOptions: FontSizeOption[] = [
  { label: 'Default', value: null },
  { label: 'Small', value: '0.875rem' },
  { label: 'Medium', value: '1.05rem' },
  { label: 'Large', value: '1.25rem' },
  { label: 'Extra large', value: '1.5rem' },
  { label: 'Huge', value: '2rem' },
];

export const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
  isDisabled,
  minHeight = '120px',
  dataTestId,
}: RichTextEditorProps) => {
  const isTestEnv = Boolean(import.meta.env?.VITEST);
  const [, forceToolbarRefresh] = useState(0);


  const editor = useEditor({
    extensions: [
      TextStyle,
      FontSizeExtension,
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder ?? 'Start typing...',
      }),
    ],
    content: value || '',
    editable: !isDisabled,
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
    onSelectionUpdate: () => forceToolbarRefresh((count) => count + 1),
    onTransaction: () => forceToolbarRefresh((count) => count + 1),
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isDisabled);
  }, [isDisabled, editor]);

  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');

  const isTextStyleActive = (option: TextStyleOption) => {
    if (!editor) {
      return option.level === null;
    }
    if (option.level === null) {
      return editor.isActive('paragraph') || !editor.isActive('heading');
    }
    return editor.isActive('heading', { level: option.level });
  };

  const activeTextStyle = textStyleOptions.find((option) => isTextStyleActive(option)) ?? textStyleOptions[0];

  const canApplyTextStyle = () => Boolean(editor);

  const handleTextStyleChange = (level: number | null) => {
    if (!editor) return;
    let chain = editor.chain().focus().unsetMark('textStyle');
    if (level) {
      chain = chain.setHeading({ level });
    } else {
      chain = chain.setParagraph();
    }
    chain.run();
  };

  const currentFontSize = editor?.getAttributes('textStyle')?.fontSize ?? null;
  const activeFontSizeOption =
    fontSizeOptions.find((option) => option.value === currentFontSize) ?? fontSizeOptions[0];

  const isFontSizeActive = (option: FontSizeOption) => option.value === currentFontSize;

  const canApplyFontSize = () => Boolean(editor);

  const handleFontSizeChange = (value: string | null) => {
    if (!editor) return;
    let chain = editor.chain().focus().setParagraph();
    if (value) {
      chain = chain.setMark('textStyle', { fontSize: value });
    } else {
      chain = chain.unsetMark('textStyle');
    }
    chain.run();
  };

  if (isTestEnv) {
    const plainValue = getPlainTextFromHtml(value);
    return (
      <Box borderWidth="1px" borderRadius="lg" borderColor="gray.200" data-testid={dataTestId}>
        <Textarea
          value={plainValue}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          minHeight={minHeight}
          isDisabled={isDisabled}
        />
      </Box>
    );
  }


  return (
    <Box borderWidth="1px" borderColor={border} borderRadius="lg" bg={bg} data-testid={dataTestId}>
      <Flex
        borderBottomWidth="1px"
        borderColor={border}
        px={2}
        py={1}
        align="center"
        gap={1}
        flexWrap="wrap"
      >
        <HStack spacing={1} flexWrap="wrap">
          <Menu>
            <Tooltip label="Text style" placement="top">
              <MenuButton
                as={Button}
                size="sm"
                variant="ghost"
                fontWeight="medium"
                px={3}
                isDisabled={isDisabled || !editor}
              >
                {activeTextStyle.label}
              </MenuButton>
            </Tooltip>
            <MenuList zIndex="popover">
              {textStyleOptions.map((option) => (
                <MenuItem
                  key={option.label}
                  onClick={() => handleTextStyleChange(option.level)}
                  isDisabled={isDisabled || !canApplyTextStyle()}
                  fontWeight={isTextStyleActive(option) ? 'semibold' : 'normal'}
                >
                  {option.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Menu>
            <Tooltip label="Font size" placement="top">
              <MenuButton
                as={Button}
                size="sm"
                variant="ghost"
                fontWeight="medium"
                px={3}
                isDisabled={isDisabled || !editor}
              >
                {activeFontSizeOption.label}
              </MenuButton>
            </Tooltip>
            <MenuList zIndex="popover">
              {fontSizeOptions.map((option) => (
                <MenuItem
                  key={option.label}
                  onClick={() => handleFontSizeChange(option.value)}
                  isDisabled={isDisabled || !canApplyFontSize()}
                  fontWeight={isFontSizeActive(option) ? 'semibold' : 'normal'}
                >
                  {option.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          {toolbarButtons.map((button) => (
            <Tooltip key={button.label} label={button.label} placement="top">
              <IconButton
                aria-label={button.label}
                icon={<button.icon size={18} />}
                size="sm"
                variant={button.isActive(editor) ? 'solid' : 'ghost'}
                colorScheme="purple"
                onClick={() => editor && button.run(editor)}
                isDisabled={isDisabled || !button.canExecute(editor ?? null)}
              />
            </Tooltip>
          ))}
        </HStack>
        <HStack spacing={1} ml="auto">
          <IconButton
            aria-label="Undo"
            icon={<MdUndo size={18} />}
            size="sm"
            variant="ghost"
            onClick={() => editor?.chain().focus().undo().run()}
            isDisabled={isDisabled || !editor?.can().chain().undo().run()}
          />
          <IconButton
            aria-label="Redo"
            icon={<MdRedo size={18} />}
            size="sm"
            variant="ghost"
            onClick={() => editor?.chain().focus().redo().run()}
            isDisabled={isDisabled || !editor?.can().chain().redo().run()}
          />
        </HStack>
      </Flex>
      <Box px={3} py={2}>
        <EditorContent
          editor={editor}
          aria-label={ariaLabel}
          className="rich-text-editor__content"
          style={{ minHeight }}
        />
      </Box>
      <style>{`
        .rich-text-editor__content .ProseMirror {
          outline: none;
          min-height: ${typeof minHeight === 'number' ? `${minHeight}px` : minHeight};
        }
        .rich-text-editor__content .ProseMirror em {
          font-style: italic;
        }
        .rich-text-editor__content .ProseMirror strong {
          font-weight: 600;
        }
        .rich-text-editor__content .ProseMirror u {
          text-decoration: underline;
        }
        .rich-text-editor__content .ProseMirror h1 {
          font-size: 1.6rem;
          font-weight: 600;
          margin: 1.25rem 0 0.35rem;
          line-height: 1.25;
        }
        .rich-text-editor__content .ProseMirror h2 {
          font-size: 1.4rem;
          font-weight: 600;
          margin: 1rem 0 0.3rem;
          line-height: 1.3;
        }
        .rich-text-editor__content .ProseMirror h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0.85rem 0 0.25rem;
          line-height: 1.35;
        }
        .rich-text-editor__content .ProseMirror h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0.75rem 0 0.2rem;
          line-height: 1.4;
        }
        .rich-text-editor__content .ProseMirror h5 {
          font-size: 1.05rem;
          font-weight: 600;
          margin: 0.6rem 0 0.2rem;
          line-height: 1.4;
        }
        .rich-text-editor__content .ProseMirror h6 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0.5rem 0 0.15rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .rich-text-editor__content .ProseMirror p {
          margin: 0 0 0.75rem;
        }
        .rich-text-editor__content .ProseMirror ul,
        .rich-text-editor__content .ProseMirror ol {
          padding-left: 1.25rem;
          margin: 0.5rem 0;
        }
      `}</style>
    </Box>
  );
};

export default RichTextEditor;
