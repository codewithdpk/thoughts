"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, onDocsChanged, type DocKind, type DocListItem } from "@/lib/api-client";

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const kind: DocKind = pathname.startsWith("/thoughts") ? "thoughts" : "notes";
  const activeId = pathname.split("/")[2];

  const [search, setSearch] = useState("");
  const [items, setItems] = useState<DocListItem[]>([]);

  const load = useCallback(async () => {
    const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    const data = await api<Record<DocKind, DocListItem[]>>(`/api/${kind}${qs}`);
    setItems(data[kind]);
  }, [kind, search]);

  useEffect(() => {
    const t = setTimeout(() => void load().catch(() => {}), search ? 200 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => onDocsChanged(() => void load().catch(() => {})), [load]);

  const create = async () => {
    const data = await api<{ note?: { id: string }; thought?: { id: string } }>(`/api/${kind}`, {
      method: "POST",
      body: {},
    });
    const id = (data.note ?? data.thought)!.id;
    await load();
    router.push(`/${kind}/${id}`);
  };

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-neutral-200 bg-neutral-100/70">
      <div className="flex items-center gap-1 px-3 pt-3">
        {(["notes", "thoughts"] as const).map((k) => (
          <Link
            key={k}
            href={`/${k}`}
            className={`flex-1 rounded-md py-1.5 text-center text-sm capitalize ${
              kind === k ? "bg-white font-semibold shadow-sm" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {k}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2 px-3 py-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${kind}`}
          className="input flex-1"
        />
        <button
          onClick={create}
          title={`New ${kind === "notes" ? "note" : "thought"}`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-xl text-amber-600 hover:bg-neutral-200"
        >
          ✎
        </button>
      </div>

      {kind === "thoughts" && (
        <Link
          href="/thoughts/graph"
          className={`mx-3 mb-2 rounded-md px-3 py-1.5 text-sm ${
            pathname === "/thoughts/graph" ? "bg-amber-200/70" : "text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          ◎ Graph view
        </Link>
      )}

      <ul className="flex-1 overflow-y-auto px-2 pb-2">
        {items.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-neutral-400">
            {search ? "No matches" : `No ${kind} yet`}
          </li>
        )}
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/${kind}/${item.id}`}
              className={`block rounded-lg px-3 py-2 ${
                item.id === activeId ? "bg-amber-200/70" : "hover:bg-neutral-200/60"
              }`}
            >
              <div className="flex items-center gap-1 truncate text-sm font-bold text-neutral-900">
                {item.pinned && <span className="text-xs text-amber-600">📌</span>}
                {item.title}
              </div>
              <div className="flex gap-2 truncate text-xs text-neutral-500">
                <span className="shrink-0" suppressHydrationWarning>
                  {formatDate(item.updatedAt)}
                </span>
                <span className="truncate">{item.excerpt || "No additional text"}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-2 text-xs text-neutral-500">
        <span className="truncate">{email}</span>
        <button onClick={logout} className="hover:text-neutral-900">
          Log out
        </button>
      </div>
    </aside>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  const diffDays = (now.getTime() - d.getTime()) / 86_400_000;
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "numeric", year: "2-digit" });
}
