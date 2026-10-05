"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, emitDocsChanged } from "@/lib/api-client";
import { Editor } from "./editor/Editor";
import { SaveIndicator, useAutosave } from "./editor/useAutosave";
import { DocHeader } from "./DocHeader";
import { LinksPanel, type ThoughtLinks } from "./LinksPanel";

export type ThoughtData = ThoughtLinks & { id: string; content: string; updatedAt: string };

export function ThoughtView({ thought: initial }: { thought: ThoughtData }) {
  const router = useRouter();
  const [thought, setThought] = useState(initial);

  // PATCH returns the thought with freshly synced links/backlinks.
  const { schedule, status } = useAutosave(async (content) => {
    const res = await api<{ thought: ThoughtData }>(`/api/thoughts/${initial.id}`, {
      method: "PATCH",
      body: { content },
    });
    setThought((prev) => ({ ...res.thought, content: prev.content }));
    emitDocsChanged();
  });

  const reload = async () => {
    const res = await api<{ thought: ThoughtData }>(`/api/thoughts/${initial.id}`);
    setThought((prev) => ({ ...res.thought, content: prev.content }));
  };

  const remove = async () => {
    if (!confirm("Delete this thought? Its connections will be removed too.")) return;
    await api(`/api/thoughts/${initial.id}`, { method: "DELETE" });
    emitDocsChanged();
    router.push("/thoughts");
  };

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <DocHeader updatedAt={thought.updatedAt} status={<SaveIndicator status={status} />}>
          <button onClick={remove} className="header-btn hover:text-red-600">
            Delete
          </button>
        </DocHeader>
        <Editor
          initialContent={initial.content}
          onChange={schedule}
          thoughtLinks
          placeholder="Title, then your thought… type [[ to link another thought"
        />
      </div>
      <LinksPanel thoughtId={initial.id} links={thought.links} backlinks={thought.backlinks} onChange={reload} />
    </div>
  );
}
