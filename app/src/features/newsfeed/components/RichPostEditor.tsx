import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Braces,
  Code2,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Smile,
  Table2,
  Trash2,
  UnderlineIcon,
  Unlink,
} from "lucide-react";
import { common, createLowlight } from "lowlight";
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Markdown } from "tiptap-markdown";

const lowlight = createLowlight(common);
const EmojiPickerPanel = lazy(() => import("./EmojiPickerPanel"));

function markdownValue(editor: Editor) {
  return (
    (editor.storage as { markdown?: { getMarkdown: () => string } }).markdown?.getMarkdown() ??
    editor.getText()
  );
}

function Tool({
  active = false,
  children,
  label,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? "is-active" : undefined}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      {children}
    </button>
  );
}

export function RichPostEditor({
  compact = false,
  expanded,
  onChange,
  onSubmit,
  placeholder = "What are you playing, building, or looking for?",
  value,
}: {
  compact?: boolean;
  expanded: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  value: string;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef(onSubmit);
  const changeRef = useRef(onChange);
  useEffect(() => {
    submitRef.current = onSubmit;
    changeRef.current = onChange;
  }, [onChange, onSubmit]);
  const editor = useEditor({
    extensions: [
      Markdown,
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      CodeBlockLowlight.configure({ lowlight }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editorProps: {
      attributes: { class: "rich-post-editor__surface", "aria-label": "Post content" },
      handleKeyDown(_view, event) {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          submitRef.current();
          return true;
        }
        return false;
      },
      handlePaste(view, event) {
        const text = event.clipboardData?.getData("text/plain");
        if (!text) return false;
        view.dispatch(view.state.tr.insertText(text));
        return true;
      },
    },
    onUpdate: ({ editor: current }) => changeRef.current(markdownValue(current)),
  });

  useEffect(() => {
    if (expanded) window.requestAnimationFrame(() => editor?.commands.focus("end"));
  }, [editor, expanded]);
  useEffect(() => {
    if (value === "" && editor && !editor.isEmpty) editor.commands.clearContent();
  }, [editor, value]);
  useEffect(() => {
    if (!linkOpen && !emojiOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof MouseEvent && popoverRef.current?.contains(event.target as Node)) return;
      setLinkOpen(false);
      setEmojiOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [emojiOpen, linkOpen]);

  if (!editor)
    return (
      <div className="rich-post-editor rich-post-editor--loading" aria-label="Loading editor">
        <i />
        <i />
        <i />
      </div>
    );
  const applyLink = () => {
    const url = linkValue.trim();
    if (!url) return;
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkOpen(false);
    setLinkValue("");
  };

  return (
    <div className="rich-post-editor" data-compact={compact || undefined} ref={popoverRef}>
      <div className="rich-post-editor__toolbar" role="toolbar" aria-label="Post formatting">
        <Tool
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </Tool>
        <Tool
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </Tool>
        <Tool
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={15} />
        </Tool>
        <span />
        <Tool
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </Tool>
        <Tool
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </Tool>
        <Tool
          label="Task list"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListChecks size={15} />
        </Tool>
        <Tool
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={15} />
        </Tool>
        <Tool
          label="Inline code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code2 size={15} />
        </Tool>
        <Tool
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Braces size={15} />
        </Tool>
        <span />
        <Tool
          label="Add link"
          active={editor.isActive("link")}
          onClick={() => {
            setEmojiOpen(false);
            setLinkValue(editor.getAttributes("link").href ?? "");
            setLinkOpen((open) => !open);
          }}
        >
          <Link2 size={15} />
        </Tool>
        {editor.isActive("link") ? (
          <Tool label="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}>
            <Unlink size={15} />
          </Tool>
        ) : null}
        {editor.isActive("table") ? (
          <Tool
            label="Remove table"
            active
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            <Trash2 size={15} />
          </Tool>
        ) : (
          <Tool
            label="Insert table"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <Table2 size={15} />
          </Tool>
        )}
        <Tool
          label="Add emoji"
          onClick={() => {
            setLinkOpen(false);
            setEmojiOpen((open) => !open);
          }}
        >
          <Smile size={15} />
        </Tool>
      </div>
      {linkOpen ? (
        <div className="rich-post-editor__link">
          <label htmlFor="post-link">Link URL</label>
          <input
            id="post-link"
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder="https://example.com"
            autoFocus
            onKeyDown={(event) => event.key === "Enter" && applyLink()}
          />
          <button type="button" onClick={applyLink} disabled={!linkValue.trim()}>
            Apply
          </button>
        </div>
      ) : null}
      {emojiOpen ? (
        <div className="rich-post-editor__emoji">
          <Suspense
            fallback={
              <div className="rich-post-editor__emoji-loading" role="status">
                <i />
                <span>Loading emojis</span>
              </div>
            }
          >
            <EmojiPickerPanel
              onSelect={(emoji) => {
                editor.chain().focus().insertContent(emoji).run();
                setEmojiOpen(false);
              }}
            />
          </Suspense>
        </div>
      ) : null}
      {!value ? <p className="rich-post-editor__placeholder">{placeholder}</p> : null}
      <EditorContent editor={editor} />
      <p className="rich-post-editor__shortcut">
        <kbd>⌘</kbd>
        <kbd>Enter</kbd> to publish
      </p>
    </div>
  );
}
