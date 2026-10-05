"use client";

import { mergeAttributes } from "@tiptap/core";
import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import { api, emitDocsChanged, type DocListItem } from "@/lib/api-client";
import { SuggestionList, type SuggestionItem, type SuggestionListHandle } from "./SuggestionList";

/**
 * Inline `[[` links between thoughts. Built on Mention so it is an atomic node,
 * serialized as <a data-thought-id="…">, which the server parses into INLINE edges.
 */
export const ThoughtLink = Mention.extend({
  name: "thoughtLink",

  parseHTML() {
    return [
      {
        tag: "a[data-thought-id]",
        getAttrs: (el) => ({
          id: (el as HTMLElement).getAttribute("data-thought-id"),
          label: (el as HTMLElement).getAttribute("data-label") ?? (el as HTMLElement).textContent,
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-thought-id": node.attrs.id,
        "data-label": node.attrs.label,
        href: `/thoughts/${node.attrs.id}`,
        class: "thought-link",
      }),
      node.attrs.label ?? "",
    ];
  },

  renderText({ node }) {
    return `[[${node.attrs.label}]]`;
  },
}).configure({
  suggestion: {
    char: "[[",
    allowSpaces: true,
    debounce: 150,

    items: async ({ query, signal }): Promise<SuggestionItem[]> => {
      const q = query.replace(/\]+$/, "").trim();
      const params = new URLSearchParams({ limit: "8", ...(q && { search: q }) });
      const { thoughts } = await api<{ thoughts: DocListItem[] }>(`/api/thoughts?${params}`, { signal });
      const items: SuggestionItem[] = thoughts.map((t) => ({ id: t.id, label: t.title }));
      if (q && !thoughts.some((t) => t.title.toLowerCase() === q.toLowerCase())) {
        items.push({ id: null, label: q, create: true });
      }
      return items;
    },

    command: ({ editor, range, props }) => {
      const insert = (id: string, label: string) =>
        editor
          .chain()
          .focus()
          .insertContentAt(range, [
            { type: "thoughtLink", attrs: { id, label } },
            { type: "text", text: " " },
          ])
          .run();

      const item = props as unknown as SuggestionItem;
      if (item.id) return void insert(item.id, item.label);

      // "Create ‘…’" option: make the thought first, then link to it.
      api<{ thought: { id: string; title: string } }>("/api/thoughts", {
        method: "POST",
        body: { content: `<h1>${escapeHtml(item.label)}</h1>` },
      }).then(({ thought }) => {
        insert(thought.id, thought.title);
        emitDocsChanged();
      });
    },

    render: () => {
      let renderer: ReactRenderer<SuggestionListHandle> | null = null;
      let unmount: (() => void) | null = null;

      return {
        onStart: (props) => {
          renderer = new ReactRenderer(SuggestionList, { props, editor: props.editor });
          unmount = props.mount(renderer.element as HTMLElement);
        },
        onUpdate: (props) => renderer?.updateProps(props),
        onKeyDown: ({ event }) => {
          if (event.key === "Escape") return false;
          return renderer?.ref?.onKeyDown(event) ?? false;
        },
        onExit: () => {
          unmount?.();
          renderer?.destroy();
          renderer = null;
        },
      };
    },
  },
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
