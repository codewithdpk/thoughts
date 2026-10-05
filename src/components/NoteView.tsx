"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, emitDocsChanged } from "@/lib/api-client";
import { Editor } from "./editor/Editor";
import { SaveIndicator, useAutosave } from "./editor/useAutosave";
import { DocHeader } from "./DocHeader";

type Note = { id: string; content: string; pinned: boolean; updatedAt: string };

export function NoteView({ note }: { note: Note }) {
  const router = useRouter();
  const [pinned, setPinned] = useState(note.pinned);
  const [updatedAt, setUpdatedAt] = useState(note.updatedAt);

  const { schedule, status } = useAutosave(async (content) => {
    const res = await api<{ note: Note }>(`/api/notes/${note.id}`, { method: "PATCH", body: { content } });
    setUpdatedAt(res.note.updatedAt);
    emitDocsChanged();
  });

  const togglePin = async () => {
    await api(`/api/notes/${note.id}`, { method: "PATCH", body: { pinned: !pinned } });
    setPinned(!pinned);
    emitDocsChanged();
  };

  const remove = async () => {
    if (!confirm("Delete this note?")) return;
    await api(`/api/notes/${note.id}`, { method: "DELETE" });
    emitDocsChanged();
    router.push("/notes");
  };

  return (
    <div className="flex h-full flex-col">
      <DocHeader updatedAt={updatedAt} status={<SaveIndicator status={status} />}>
        <button onClick={togglePin} className="header-btn" title={pinned ? "Unpin" : "Pin"}>
          {pinned ? "Unpin" : "Pin"}
        </button>
        <button onClick={remove} className="header-btn hover:text-red-600" title="Delete">
          Delete
        </button>
      </DocHeader>
      <Editor initialContent={note.content} onChange={schedule} placeholder="Title, then your note…" />
    </div>
  );
}
