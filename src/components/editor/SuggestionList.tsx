"use client";

import { forwardRef, useImperativeHandle, useState } from "react";

export type SuggestionItem = { id: string | null; label: string; create?: boolean };
export type SuggestionListHandle = { onKeyDown: (event: KeyboardEvent) => boolean };

type Props = { items: SuggestionItem[]; command: (item: SuggestionItem) => void };

export const SuggestionList = forwardRef<SuggestionListHandle, Props>(function SuggestionList(
  { items, command },
  ref,
) {
  const [selected, setSelected] = useState(0);
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setSelected(0);
  }

  useImperativeHandle(ref, () => ({
    onKeyDown(event) {
      if (!items.length) return false;
      if (event.key === "ArrowDown") {
        setSelected((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelected((i) => (i - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        command(items[selected]);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="z-50 w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 text-sm shadow-lg">
      {items.length === 0 ? (
        <div className="px-3 py-2 text-neutral-400">Type to search thoughts…</div>
      ) : (
        items.map((item, i) => (
          <button
            key={item.id ?? `create-${item.label}`}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => command(item)}
            className={`block w-full truncate px-3 py-1.5 text-left ${
              i === selected ? "bg-amber-100" : "hover:bg-neutral-100"
            }`}
          >
            {item.create ? (
              <span className="text-neutral-500">
                Create <span className="font-semibold text-neutral-800">“{item.label}”</span>
              </span>
            ) : (
              item.label
            )}
          </button>
        ))
      )}
    </div>
  );
});
