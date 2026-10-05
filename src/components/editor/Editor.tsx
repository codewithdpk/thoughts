"use client";

import { useRouter } from "next/navigation";
import { EditorContent, useEditor, useEditorState, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { ThoughtLink } from "./thought-link";

type Props = {
  initialContent: string;
  onChange: (html: string) => void;
  /** Enables `[[` inline links (thoughts only). */
  thoughtLinks?: boolean;
  placeholder?: string;
};

export function Editor({ initialContent, onChange, thoughtLinks = false, placeholder }: Props) {
  const router = useRouter();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
      ...(thoughtLinks ? [ThoughtLink] : []),
    ],
    content: initialContent,
    autofocus: initialContent ? false : "end",
    editorProps: {
      attributes: { class: "journal-editor" },
      handleClickOn: (_view, _pos, node) => {
        if (node.type.name !== "thoughtLink") return false;
        router.push(`/thoughts/${node.attrs.id}`);
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} className="min-h-0 flex-1 overflow-y-auto" />
    </div>
  );
}

function Toolbar({ editor }: { editor: TiptapEditor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      task: e.isActive("taskList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
    }),
  });

  const setLink = () => {
    if (state.link) return editor.chain().focus().unsetLink().run();
    const href = window.prompt("Link URL");
    if (href) editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const c = () => editor.chain().focus();
  const buttons: [string, string, boolean, () => void][] = [
    ["B", "Bold", state.bold, () => c().toggleBold().run()],
    ["I", "Italic", state.italic, () => c().toggleItalic().run()],
    ["S", "Strikethrough", state.strike, () => c().toggleStrike().run()],
    ["H1", "Title", state.h1, () => c().toggleHeading({ level: 1 }).run()],
    ["H2", "Heading", state.h2, () => c().toggleHeading({ level: 2 }).run()],
    ["•", "Bulleted list", state.bullet, () => c().toggleBulletList().run()],
    ["1.", "Numbered list", state.ordered, () => c().toggleOrderedList().run()],
    ["☑", "Checklist", state.task, () => c().toggleTaskList().run()],
    ["❝", "Quote", state.quote, () => c().toggleBlockquote().run()],
    ["🔗", "Link", state.link, setLink],
  ];

  return (
    <div className="flex flex-wrap gap-0.5 border-b border-neutral-100 px-6 py-1.5">
      {buttons.map(([label, title, active, run]) => (
        <button
          key={title}
          type="button"
          title={title}
          onClick={run}
          className={`h-7 min-w-7 rounded px-1.5 text-sm text-neutral-600 hover:bg-neutral-100 ${
            active ? "bg-neutral-200 text-neutral-900" : ""
          } ${label === "B" ? "font-bold" : ""} ${label === "I" ? "italic" : ""} ${label === "S" ? "line-through" : ""}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
