import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bold, Italic, Link2, List, ListOrdered, Redo2, Undo2 } from 'lucide-react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { FORMAT_TEXT_COMMAND, REDO_COMMAND, UNDO_COMMAND, $getSelection, $isRangeSelection, $getRoot, $createParagraphNode, $createTextNode, type LexicalEditor as LexicalInstance } from 'lexical';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { $isLinkNode, LinkNode } from '@lexical/link';
import { CodeNode } from '@lexical/code';
import './LexicalEditor.scss';
import { emptyLexicalStateJson, lexicalToPlainText } from '@/lib/utils/lexicalPlainText';

const EXTERNAL_SYNC_TAG = 'external-sync';

function applySerializedValue(editor: LexicalInstance, value: string) {
  const nextValue = value || emptyLexicalStateJson();

  try {
    const parsed = editor.parseEditorState(nextValue);
    editor.setEditorState(parsed, {tag: EXTERNAL_SYNC_TAG});
  } catch {
    const plain =
      lexicalToPlainText(nextValue) ||
      (typeof nextValue === 'string' ? nextValue : '');
    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        if (plain) paragraph.append($createTextNode(plain));
        root.append(paragraph);
      },
      {tag: EXTERNAL_SYNC_TAG},
    );
  }
}

function Icon({title, children}: { title: string; children: ReactNode }) {
  return (
    <span className="lx-icon" aria-hidden="true" title={title}>
      {children}
    </span>
  );
}

function Toolbar({disabled}: { disabled: boolean }) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [listType, setListType] = useState<'bullet' | 'number' | null>(null);
  
  useEffect(() => {
    return editor.registerUpdateListener(({editorState}) => {
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
  
  const btnClass = (active: boolean) => active ? 'lx-btn-icon lx-btn-active' : 'lx-btn-icon';
  
  return (
    <div className="lx-toolbar">
      <button
        className="lx-btn-icon"
        type="button"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        disabled={disabled}>
        <Icon title="Undo">
          <Undo2 size={16}/>
        </Icon>
      </button>
      <button
        className="lx-btn-icon"
        type="button"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={disabled}>
        <Icon title="Redo">
          <Redo2 size={16}/>
        </Icon>
      </button>
      
      <div className="lx-sep"/>
      
      <button
        className={btnClass(isBold)}
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        disabled={disabled}>
        <Icon title="Bold">
          <Bold size={16}/>
        </Icon>
      </button>
      <button
        className={btnClass(isItalic)}
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        disabled={disabled}>
        <Icon title="Italic">
          <Italic size={16}/>
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
          <List size={16}/>
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
          <ListOrdered size={16}/>
        </Icon>
      </button>
      <button className={btnClass(isLink)} type="button" disabled>
        <Icon title="Link (coming soon)">
          <Link2 size={16}/>
        </Icon>
      </button>
    </div>
  );
}

function SyncFromValue({
                         value,
                         enabled,
                         lastEmittedJsonRef,
                       }: {
  // Lexical serialized EditorState JSON string.
  value: string;
  enabled: boolean;
  lastEmittedJsonRef: { current: string | null };
}) {
  const [editor] = useLexicalComposerContext();
  const lastAppliedRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    // Avoid re-applying the same document over and over, and avoid feedback loops:
    // when `value` comes from this editor's own onChange, it will match
    // `lastEmittedJsonRef.current`.
    if ((lastAppliedRef.current != null && value === lastAppliedRef.current) || (lastEmittedJsonRef.current != null && value === lastEmittedJsonRef.current)) return;
    
    applySerializedValue(editor, value);
    lastAppliedRef.current = value;
  }, [editor, enabled, lastEmittedJsonRef, value]);
  
  return null;
}

function SetEditable({disabled}: { disabled: boolean }) {
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
                                        className = '',
                                      }: {
  // Serialized Lexical editorState JSON string.
  value: string;
  onChange?: (json: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showToolbar?: boolean;
  className?: string;
}) {
  const initialConfig = useMemo(() => {
    return {
      namespace: 'CommentsEditor',
      editable: !disabled,
      editorState(editor: LexicalInstance) {
        applySerializedValue(editor, value);
      },
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
  }, [disabled, value]);
  
  const lastEmittedJsonRef = useRef<string | null>(null);
  
  return (
    <div
      className={[
        'lx-editor',
        showToolbar ? '' : 'lx-readonly',
        className,
      ]
        .filter(Boolean)
        .join(' ')}>
      <LexicalComposer initialConfig={initialConfig}>
        {showToolbar && <Toolbar disabled={disabled}/>}
        <div className="lx-content">
          <RichTextPlugin
            contentEditable={<ContentEditable className="lx-editable"/>}
            placeholder={<div className="lx-placeholder">{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          {showToolbar && <HistoryPlugin/>}
          <ListPlugin/>
          <LinkPlugin/>
          <SetEditable disabled={disabled}/>
          <SyncFromValue
            value={value || ''}
            enabled={true}
            lastEmittedJsonRef={lastEmittedJsonRef}
          />
          {onChange && (
            <OnChangePlugin
              ignoreSelectionChange={true}
              onChange={(editorState, _editor, tags) => {
                if (tags.has(EXTERNAL_SYNC_TAG)) return;
                const json = JSON.stringify(editorState.toJSON());
                lastEmittedJsonRef.current = json;
                onChange(json);
              }}
            />
          )}
        </div>
      </LexicalComposer>
    </div>
  );
}
