import type { ReactNode } from "react";

export function DocHeader({
  updatedAt,
  status,
  children,
}: {
  updatedAt: string;
  status: ReactNode;
  children?: ReactNode;
}) {
  const formatted = new Date(updatedAt).toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-2">
      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span suppressHydrationWarning>{formatted}</span>
        {status}
      </div>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}
