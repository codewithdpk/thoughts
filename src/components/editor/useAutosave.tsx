"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

/** Debounced save; flushes pending changes on unmount (e.g. switching documents). */
export function useAutosave(save: (html: string) => Promise<void>, delay = 800) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<string | null>(null);
  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const html = pending.current;
    if (html === null) return;
    pending.current = null;
    setStatus("saving");
    try {
      await saveRef.current(html);
      setStatus(pending.current === null ? "saved" : "pending");
    } catch {
      setStatus("error");
    }
  }, []);

  const schedule = useCallback(
    (html: string) => {
      pending.current = html;
      setStatus("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush, delay],
  );

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current !== null) e.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      void flush();
    };
  }, [flush]);

  return { schedule, status };
}

export function SaveIndicator({ status }: { status: SaveStatus }) {
  const text = { idle: "", pending: "Editing…", saving: "Saving…", saved: "Saved", error: "Save failed" }[status];
  return <span className={`text-xs ${status === "error" ? "text-red-500" : "text-neutral-400"}`}>{text}</span>;
}
