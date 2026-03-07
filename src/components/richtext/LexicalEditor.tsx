import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import {
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $createParagraphNode,
} from 'lexical';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { $isLinkNode, LinkNode } from '@lexical/link';
import { CodeNode } from '@lexical/code';
import './LexicalEditor.scss';

function Icon({ title, children }: { title: string; children: ReactNode }) {
  return (
    <span className="lx-icon" aria-hidden="true" title={title}>
      {children}
    </span>
  );
}

function Toolbar({ disabled }: { disabled: boolean }) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [listType, setListType] = useState<'bullet' | 'number' | null>(null);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setIsBold(false);
          setIsItalic(false);
          setIsLink(false);
          setListType(null);
          return;
        }

        setIsBold(selection.hasFormat('bold'));
        setIsItalic(selection.hasFormat('italic'));

        const anchorNode = selection.anchor.getNode();
        const parent = anchorNode.getParent();
        setIsLink($isLinkNode(parent) || $isLinkNode(anchorNode));

        // List type detection without importing list-node utils: rely on DOM nesting.
        // This is good enough for our current features (bullet/ordered toggles).
        const dom = editor.getElementByKey(anchorNode.getKey());
        const listEl = dom?.closest?.('ul,ol') as HTMLElement | null;
        if (!listEl) setListType(null);
        else
          setListType(
            listEl.tagName.toLowerCase() === 'ol' ? 'number' : 'bullet',
          );
      });
    });
  }, [editor]);

  const btnClass = (active: boolean) =>
    active ? 'lx-btn-icon lx-btn-active' : 'lx-btn-icon';

  return (
    <div className="lx-toolbar">
      <button
        className="lx-btn-icon"
        type="button"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        disabled={disabled}>
        <Icon title="Undo">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M7.4 7H13a7 7 0 1 1 0 14h-1v-2h1a5 5 0 1 0 0-10H7.4l2.3 2.3-1.4 1.4L3.6 8l4.7-4.7 1.4 1.4L7.4 7Z"
            />
          </svg>
        </Icon>
      </button>
      <button
        className="lx-btn-icon"
        type="button"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={disabled}>
        <Icon title="Redo">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M16.6 7H11a7 7 0 1 0 0 14h1v-2h-1a5 5 0 1 1 0-10h5.6l-2.3 2.3 1.4 1.4L20.4 8l-4.7-4.7-1.4 1.4L16.6 7Z"
            />
          </svg>
        </Icon>
      </button>

      <div className="lx-sep" />

      <button
        className={btnClass(isBold)}
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        disabled={disabled}>
        <Icon title="Bold">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M7 5h6.2a4 4 0 0 1 0 8H7V5Zm0 10h7a4 4 0 0 1 0 8H7v-8Zm2-8v4h4.2a2 2 0 1 0 0-4H9Zm0 10v4h5a2 2 0 1 0 0-4H9Z"
            />
          </svg>
        </Icon>
      </button>
      <button
        className={btnClass(isItalic)}
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        disabled={disabled}>
        <Icon title="Italic">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M10 5h8v2h-3l-4 10h3v2H6v-2h3l4-10h-3V5Z"
            />
          </svg>
        </Icon>
      </button>
      <button
        className={btnClass(listType === 'bullet')}
        type="button"
        onClick={() => {
          if (listType === 'bullet')
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          else editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }}
        disabled={disabled}>
        <Icon title="Bulleted list">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M7 6h14v2H7V6Zm0 5h14v2H7v-2Zm0 5h14v2H7v-2ZM3.5 7A1.5 1.5 0 1 0 3.5 4a1.5 1.5 0 0 0 0 3Zm0 5A1.5 1.5 0 1 0 3.5 9a1.5 1.5 0 0 0 0 3Zm0 5A1.5 1.5 0 1 0 3.5 14a1.5 1.5 0 0 0 0 3Z"
            />
          </svg>
        </Icon>
      </button>
      <button
        className={btnClass(listType === 'number')}
        type="button"
        onClick={() => {
          if (listType === 'number')
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          else editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }}
        disabled={disabled}>
        <Icon title="Numbered list">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M7 6h14v2H7V6Zm0 5h14v2H7v-2Zm0 5h14v2H7v-2ZM3 6h2v2H2V7h1V6Zm0 5h2v2H2v-1h1v-1Zm2 6H2v-2h3v1H3v1h2v1Z"
            />
          </svg>
        </Icon>
      </button>
      <button className={btnClass(isLink)} type="button" disabled>
        <Icon title="Link (coming soon)">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M10.6 13.4a1 1 0 0 1 0-1.4l3.4-3.4a3 3 0 1 1 4.2 4.2l-2.3 2.3a3 3 0 0 1-4.2 0 1 1 0 1 1 1.4-1.4 1 1 0 0 0 1.4 0l2.3-2.3a1 1 0 0 0-1.4-1.4l-3.4 3.4a1 1 0 0 1-1.4 0ZM13.4 10.6a1 1 0 0 1 0 1.4l-3.4 3.4a3 3 0 1 1-4.2-4.2l2.3-2.3a3 3 0 0 1 4.2 0 1 1 0 1 1-1.4 1.4 1 1 0 0 0-1.4 0l-2.3 2.3a1 1 0 0 0 1.4 1.4l3.4-3.4a1 1 0 0 1 1.4 0Z"
            />
          </svg>
        </Icon>
      </button>
    </div>
  );
}

function SyncFromValue({
  value,
}: {
  // Lexical serialized EditorState JSON string.
  value: string;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!value) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        root.append($createParagraphNode());
      });
      return;
    }
    try {
      const parsed = editor.parseEditorState(value);
      editor.setEditorState(parsed);
    } catch {
      // ignore malformed stored data
    }
  }, [editor, value]);

  return null;
}

function SetEditable({ disabled }: { disabled: boolean }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.setEditable(!disabled);
  }, [editor, disabled]);
  return null;
}

export default function LexicalEditor({
  value,
  onChange,
  placeholder = 'Write comments…',
  disabled = false,
  showToolbar = true,
}: {
  // Serialized Lexical editorState JSON string.
  value: string;
  onChange?: (json: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showToolbar?: boolean;
}) {
  const initialConfig = useMemo(() => {
    return {
      namespace: 'CommentsEditor',
      editable: !disabled,
      onError(error: Error) {
        // eslint-disable-next-line no-console
        console.error(error);
      },
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        LinkNode,
        CodeNode,
      ],
    };
  }, [disabled]);

  return (
    <div className={showToolbar ? 'lx-editor' : 'lx-editor lx-readonly'}>
      <LexicalComposer initialConfig={initialConfig}>
        {showToolbar && <Toolbar disabled={disabled} />}
        <div className="lx-content">
          <RichTextPlugin
            contentEditable={<ContentEditable className="lx-editable" />}
            placeholder={<div className="lx-placeholder">{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          {showToolbar && <HistoryPlugin />}
          <ListPlugin />
          <LinkPlugin />
          <SetEditable disabled={disabled} />
          {onChange && (
            <OnChangePlugin
              onChange={(editorState) => {
                const json = JSON.stringify(editorState.toJSON());
                onChange(json);
              }}
            />
          )}
          <SyncFromValue value={value || ''} />
        </div>
      </LexicalComposer>
    </div>
  );
}
