"use client";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** fetch wrapper for our own API: JSON in/out, cookie auth, bounce to /login on 401. */
export async function api<T = unknown>(path: string, init: Omit<RequestInit, "body"> & { body?: unknown } = {}) {
  const { body, ...rest } = init;
  const res = await fetch(path, {
    ...rest,
    headers: { "Content-Type": "application/json", ...rest.headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401 && !path.startsWith("/api/auth/login")) {
    // Hard navigation on purpose: drops all client state after the session expires.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error ?? res.statusText);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

// Lets the sidebar list refresh after a save/create/delete elsewhere on the page.
const DOCS_CHANGED = "docs:changed";
export const emitDocsChanged = () => window.dispatchEvent(new Event(DOCS_CHANGED));
export function onDocsChanged(cb: () => void) {
  window.addEventListener(DOCS_CHANGED, cb);
  return () => window.removeEventListener(DOCS_CHANGED, cb);
}

export type DocKind = "notes" | "thoughts";

export type DocListItem = {
  id: string;
  title: string;
  excerpt: string;
  pinned?: boolean;
  updatedAt: string;
};
