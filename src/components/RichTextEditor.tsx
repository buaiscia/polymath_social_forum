import { memo, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Flex,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  Tooltip,
  VStack,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { Extension } from '@tiptap/core';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import type { Level } from '@tiptap/extension-heading';
import { isValidEmailAddress } from '../utils/sanitizeHtml';
import {
  MdInsertLink,
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
  onEditorCreated?: (editor: Editor) => void;
}

type ToolbarButton = {
  icon: typeof MdFormatBold;
  label: string;
  isActive: (editor: Editor | null) => boolean;
  run: (editor: Editor) => void;
  canExecute: (editor: Editor | null) => boolean;
  shortcutHint?: string;
  ariaKeyShortcuts?: string;
};

type TextStyleOption = {
  label: string;
  level: Level | null;
};

type FontSizeOption = {
  label: string;
  value: string | null;
};

const normalizeLinkHref = (rawValue: string) => {
  if (!rawValue) {
    return null;
  }
  let value = rawValue.trim();
  if (!value) {
    return null;
  }
  const hasProtocol = /^[a-zA-Z][\w+.-]*:/.test(value);
  if (!hasProtocol) {
    if (isValidEmailAddress(value)) {
      value = `mailto:${value}`;
    } else {
      value = `https://${value}`;
    }
  }
  if (value.toLowerCase().startsWith('mailto:')) {
    const email = value.slice(7);
    return isValidEmailAddress(email) ? `mailto:${email}` : null;
  }
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch (error) {
    return null;
  }
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
    shortcutHint: 'Cmd/Ctrl + B',
    ariaKeyShortcuts: 'Control+B Meta+B',
  },
  {
    icon: MdFormatItalic,
    label: 'Italic',
    isActive: (editor) => Boolean(editor?.isActive('italic')),
    run: (editor) => editor.chain().focus().toggleItalic().run(),
    canExecute: (editor) => Boolean(editor?.can().chain().toggleItalic().run()),
    shortcutHint: 'Cmd/Ctrl + I',
    ariaKeyShortcuts: 'Control+I Meta+I',
  },
  {
    icon: MdFormatUnderlined,
    label: 'Underline',
    isActive: (editor) => Boolean(editor?.isActive('underline')),
    run: (editor) => editor.chain().focus().toggleUnderline().run(),
    canExecute: (editor) => Boolean(editor?.can().chain().toggleUnderline().run()),
    shortcutHint: 'Cmd/Ctrl + U',
    ariaKeyShortcuts: 'Control+U Meta+U',
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
  onEditorCreated,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      TextStyle,
      FontSizeExtension,
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        validate: (href) => Boolean(normalizeLinkHref(href)),
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Start typing...',
      }),
    ],
    content: value || '',
    editable: !isDisabled,
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
  });

  useEffect(() => {
    if (editor && onEditorCreated) {
      onEditorCreated(editor);
    }
  }, [editor, onEditorCreated]);

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
  const linkColor = useColorModeValue('#5b21b6', '#b794f6');

  return (
    <Box borderWidth="1px" borderColor={border} borderRadius="lg" bg={bg} data-testid={dataTestId}>
      <RichTextToolbar editor={editor} isDisabled={isDisabled} borderColor={border} />
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
        .rich-text-editor__content .ProseMirror a {
          color: ${linkColor};
          text-decoration: underline;
          font-weight: 500;
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

interface RichTextToolbarProps {
  editor: Editor | null;
  isDisabled?: boolean;
  borderColor: string;
}

type ToolbarButtonSnapshot = {
  isActive: boolean;
  canExecute: boolean;
};

interface ToolbarSnapshot {
  textStyleLevel: number | null;
  fontSize: string | null;
  buttons: Record<string, ToolbarButtonSnapshot>;
  isLinkActive: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

const computeToolbarSnapshot = (editor: Editor): ToolbarSnapshot => {
  const textStyleLevel = (() => {
    for (const option of textStyleOptions) {
      if (option.level && editor.isActive('heading', { level: option.level })) {
        return option.level;
      }
      if (
        option.level === null &&
        (editor.isActive('paragraph') || !editor.isActive('heading'))
      ) {
        return null;
      }
    }
    return null;
  })();

  const buttons = toolbarButtons.reduce<Record<string, ToolbarButtonSnapshot>>((acc, button) => {
    acc[button.label] = {
      isActive: button.isActive(editor),
      canExecute: button.canExecute(editor),
    };
    return acc;
  }, {});

  return {
    textStyleLevel,
    fontSize: editor.getAttributes('textStyle')?.fontSize ?? null,
    buttons,
    isLinkActive: editor.isActive('link'),
    canUndo: Boolean(editor.can().chain().undo().run()),
    canRedo: Boolean(editor.can().chain().redo().run()),
  };
};

const areToolbarSnapshotsEqual = (prev: ToolbarSnapshot | null, next: ToolbarSnapshot | null) => {
  if (prev === next) return true;
  if (!prev || !next) return false;
  if (
    prev.textStyleLevel !== next.textStyleLevel ||
    prev.fontSize !== next.fontSize ||
    prev.isLinkActive !== next.isLinkActive ||
    prev.canUndo !== next.canUndo ||
    prev.canRedo !== next.canRedo
  ) {
    return false;
  }
  for (const button of toolbarButtons) {
    const prevState = prev.buttons[button.label];
    const nextState = next.buttons[button.label];
    if (!prevState || !nextState) {
      return false;
    }
    if (prevState.isActive !== nextState.isActive || prevState.canExecute !== nextState.canExecute) {
      return false;
    }
  }
  return true;
};

const useToolbarSnapshot = (editor: Editor | null) => {
  const [snapshot, setSnapshot] = useState<ToolbarSnapshot | null>(() => (editor ? computeToolbarSnapshot(editor) : null));

  useEffect(() => {
    if (!editor) {
      setSnapshot(null);
      return;
    }

    const updateSnapshot = () => {
      setSnapshot((prev) => {
        const next = computeToolbarSnapshot(editor);
        return areToolbarSnapshotsEqual(prev, next) ? prev : next;
      });
    };

    updateSnapshot();
    const events: Array<Parameters<Editor['on']>[0]> = ['selectionUpdate', 'transaction', 'focus', 'blur'];
    events.forEach((event) => editor.on(event, updateSnapshot));
    return () => {
      events.forEach((event) => editor.off(event, updateSnapshot));
    };
  }, [editor]);

  return snapshot;
};

const RichTextToolbar = memo(function RichTextToolbarComponent({ editor, isDisabled, borderColor }: RichTextToolbarProps) {
  const toolbarSnapshot = useToolbarSnapshot(editor);
  const linkInputRef = useRef<HTMLInputElement | null>(null);
  const { isOpen: isLinkPopoverOpen, onOpen: onLinkPopoverOpen, onClose: onLinkPopoverClose } = useDisclosure();
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');

  const closeLinkPopover = () => {
    setLinkError('');
    onLinkPopoverClose();
  };

  const handleLinkSave = () => {
    if (!editor) return;
    const normalized = normalizeLinkHref(linkUrl);
    if (!normalized) {
      setLinkError('Enter a valid http(s) URL or email address.');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: normalized }).run();
    closeLinkPopover();
  };

  const handleLinkRemove = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    closeLinkPopover();
  };

  const activeTextStyleLevel = toolbarSnapshot?.textStyleLevel ?? null;
  const activeTextStyle = textStyleOptions.find((option) => option.level === activeTextStyleLevel) ?? textStyleOptions[0];

  const handleTextStyleChange = (level: Level | null) => {
    if (!editor) return;
    let chain = editor.chain().focus().unsetMark('textStyle');
    if (level) {
      chain = chain.setHeading({ level });
    } else {
      chain = chain.setParagraph();
    }
    chain.run();
  };

  const currentFontSize = toolbarSnapshot?.fontSize ?? null;
  const activeFontSizeOption =
    fontSizeOptions.find((option) => option.value === currentFontSize) ?? fontSizeOptions[0];

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

  return (
    <Flex borderBottomWidth="1px" borderColor={borderColor} px={2} py={1} align="center" gap={1} flexWrap="wrap">
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
                isDisabled={isDisabled || !editor}
                fontWeight={option.level === activeTextStyleLevel ? 'semibold' : 'normal'}
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
                isDisabled={isDisabled || !editor}
                fontWeight={option.value === currentFontSize ? 'semibold' : 'normal'}
              >
                {option.label}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
        {toolbarButtons.map((button) => {
          const tooltipLabel = button.shortcutHint ? `${button.label} (${button.shortcutHint})` : button.label;
          const buttonSnapshot = toolbarSnapshot?.buttons[button.label];
          return (
            <Tooltip key={button.label} label={tooltipLabel} placement="top">
              <IconButton
                aria-label={button.label}
                aria-keyshortcuts={button.ariaKeyShortcuts}
                icon={<button.icon size={18} />}
                size="sm"
                variant={buttonSnapshot?.isActive ? 'solid' : 'ghost'}
                colorScheme="purple"
                onClick={() => editor && button.run(editor)}
                isDisabled={isDisabled || !buttonSnapshot?.canExecute}
              />
            </Tooltip>
          );
        })}
        <Popover
          isOpen={isLinkPopoverOpen}
          onClose={closeLinkPopover}
          closeOnBlur
          initialFocusRef={linkInputRef}
          placement="bottom-start"
        >
          <PopoverTrigger>
            <span>
              <Tooltip label="Insert link" placement="top">
                <IconButton
                  aria-label="Insert link"
                  icon={<MdInsertLink size={18} />}
                  size="sm"
                  variant={toolbarSnapshot?.isLinkActive ? 'solid' : 'ghost'}
                  colorScheme="purple"
                  onClick={() => {
                    if (!editor || isDisabled) return;
                    const currentHref = editor.getAttributes('link')?.href ?? '';
                    setLinkUrl(currentHref);
                    setLinkError('');
                    onLinkPopoverOpen();
                  }}
                  isDisabled={isDisabled || !editor}
                />
              </Tooltip>
            </span>
          </PopoverTrigger>
          <PopoverContent w="280px" _focus={{ outline: 'none' }}>
            <PopoverArrow />
            <PopoverBody>
              <VStack spacing={3} align="stretch">
                <FormControl isInvalid={Boolean(linkError)}>
                  <FormLabel fontSize="sm">Link URL</FormLabel>
                  <Input
                    ref={linkInputRef}
                    size="sm"
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(event) => {
                      setLinkUrl(event.target.value);
                      if (linkError) setLinkError('');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        event.stopPropagation();
                        handleLinkSave();
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                        closeLinkPopover();
                      }
                    }}
                  />
                  <Text fontSize="xs" color={linkError ? 'red.500' : 'gray.500'} mt={1}>
                    {linkError || 'Supports http, https, or mailto links.'}
                  </Text>
                </FormControl>
                <HStack justify="flex-end" spacing={2}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleLinkRemove}
                    isDisabled={!editor?.isActive('link')}
                  >
                    Remove
                  </Button>
                  <Button size="sm" colorScheme="purple" type="button" onClick={handleLinkSave}>
                    Save
                  </Button>
                </HStack>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </HStack>
      <HStack spacing={1} ml="auto">
        <IconButton
          aria-label="Undo"
          icon={<MdUndo size={18} />}
          size="sm"
          variant="ghost"
          onClick={() => editor?.chain().focus().undo().run()}
          isDisabled={isDisabled || !toolbarSnapshot?.canUndo}
        />
        <IconButton
          aria-label="Redo"
          icon={<MdRedo size={18} />}
          size="sm"
          variant="ghost"
          onClick={() => editor?.chain().focus().redo().run()}
          isDisabled={isDisabled || !toolbarSnapshot?.canRedo}
        />
      </HStack>
    </Flex>
  );
});

