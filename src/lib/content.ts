import "server-only";
import sanitizeHtml from "sanitize-html";

// Mirrors what the TipTap editor produces (StarterKit + task list + thought links).
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "h1", "h2", "h3", "strong", "em", "s", "u", "code", "pre", "blockquote",
    "ul", "ol", "li", "br", "hr", "a", "div", "span", "label", "input",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "class", "data-type", "data-id", "data-label", "data-thought-id"],
    ul: ["data-type"],
    li: ["data-type", "data-checked"],
    input: ["type", "checked"],
    ol: ["start"],
    code: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
};

export const sanitize = (html: string) => sanitizeHtml(html, SANITIZE_OPTIONS);

const ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " ",
};

/** Plain-text lines, one per block element. */
function toLines(html: string) {
  const withBreaks = html.replace(/<\/(p|h[1-6]|li|blockquote|pre|div)>|<br\s*\/?>/gi, "\n");
  const text = sanitizeHtml(withBreaks, { allowedTags: [], allowedAttributes: {} })
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m);
  return text.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
}

/** Apple Notes style: the first line is the title, the rest is the list snippet. */
export function deriveTitleAndExcerpt(html: string) {
  const [first = "", ...rest] = toLines(html);
  return {
    title: first.slice(0, 200) || "Untitled",
    excerpt: rest.join(" ").slice(0, 140),
  };
}

/** Explicit title wins; otherwise derive it from content. */
export function prepareContent(input: { title?: string; content?: string }) {
  if (input.content === undefined) {
    return input.title !== undefined ? { title: input.title || "Untitled" } : {};
  }
  const content = sanitize(input.content);
  const derived = deriveTitleAndExcerpt(content);
  return { content, excerpt: derived.excerpt, title: input.title || derived.title };
}
