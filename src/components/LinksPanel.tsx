"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type DocListItem } from "@/lib/api-client";

type LinkRef = {
  id: string;
  kind: "INLINE" | "MANUAL";
  label: string | null;
  thought: { id: string; title: string };
};

export type ThoughtLinks = { links: LinkRef[]; backlinks: LinkRef[] };

export function LinksPanel({
  thoughtId,
  links,
  backlinks,
  onChange,
}: ThoughtLinks & { thoughtId: string; onChange: () => void }) {
  return (
    <aside className="hidden w-64 shrink-0 overflow-y-auto border-l border-neutral-100 bg-neutral-50/60 px-4 py-4 text-sm lg:block">
      <Section title="Links" items={links} thoughtId={thoughtId} removable onChange={onChange} />
      <Section title="Backlinks" items={backlinks} thoughtId={thoughtId} onChange={onChange} />
      <ConnectForm thoughtId={thoughtId} onConnected={onChange} />
    </aside>
  );
}

function Section({
  title,
  items,
  thoughtId,
  removable,
  onChange,
}: {
  title: string;
  items: LinkRef[];
  thoughtId: string;
  removable?: boolean;
  onChange: () => void;
}) {
  const remove = async (linkId: string) => {
    await api(`/api/thoughts/${thoughtId}/links/${linkId}`, { method: "DELETE" });
    onChange();
  };

  return (
    <section className="mb-6">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {title} <span className="font-normal">({items.length})</span>
      </h3>
      {items.length === 0 && <p className="text-neutral-400">None yet</p>}
      <ul className="space-y-1">
        {items.map((l) => (
          <li key={l.id} className="group flex items-start gap-2">
            <span className="mt-0.5 text-[10px] text-neutral-400" title={l.kind === "INLINE" ? "Inline [[link]]" : "Manual connection"}>
              {l.kind === "INLINE" ? "[[ ]]" : "⟷"}
            </span>
            <div className="min-w-0 flex-1">
              <Link href={`/thoughts/${l.thought.id}`} className="block truncate text-neutral-800 hover:text-amber-700">
                {l.thought.title}
              </Link>
              {l.label && <span className="text-xs text-neutral-500">{l.label}</span>}
            </div>
            {removable && l.kind === "MANUAL" && (
              <button
                onClick={() => remove(l.id)}
                className="text-neutral-400 opacity-0 hover:text-red-600 group-hover:opacity-100"
                title="Remove connection"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ConnectForm({ thoughtId, onConnected }: { thoughtId: string; onConnected: () => void }) {
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [results, setResults] = useState<DocListItem[]>([]);
  const [target, setTarget] = useState<DocListItem | null>(null);

  useEffect(() => {
    if (!query.trim() || target) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      api<{ thoughts: DocListItem[] }>(`/api/thoughts?limit=6&search=${encodeURIComponent(query)}`, {
        signal: ctrl.signal,
      })
        .then((r) => setResults(r.thoughts.filter((x) => x.id !== thoughtId)))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, target, thoughtId]);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    await api(`/api/thoughts/${thoughtId}/links`, {
      method: "POST",
      body: { targetId: target.id, label: label || undefined },
    });
    setQuery("");
    setLabel("");
    setTarget(null);
    setResults([]);
    onConnected();
  };

  return (
    <form onSubmit={connect} className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Connect</h3>
      <div className="relative">
        <input
          value={target ? target.title : query}
          onChange={(e) => {
            setTarget(null);
            setQuery(e.target.value);
          }}
          placeholder="Find a thought…"
          className="input"
        />
        {!target && query && results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-neutral-200 bg-white shadow">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setTarget(r)}
                  className="block w-full truncate px-2 py-1.5 text-left hover:bg-neutral-100"
                >
                  {r.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)" className="input" />
      <button
        type="submit"
        disabled={!target}
        className="w-full rounded-md bg-neutral-900 py-1.5 text-white disabled:opacity-30"
      >
        Connect
      </button>
    </form>
  );
}
