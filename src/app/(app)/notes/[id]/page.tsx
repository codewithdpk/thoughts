import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { HttpError } from "@/lib/http";
import { getNote } from "@/lib/services/notes";
import { NoteView } from "@/components/NoteView";

export default async function NotePage({ params }: PageProps<"/notes/[id]">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const note = await getNote(session.userId, id).catch((e) => {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  });

  return (
    <NoteView
      key={note.id}
      note={{ id: note.id, content: note.content, pinned: note.pinned, updatedAt: note.updatedAt.toISOString() }}
    />
  );
}
