import { NextResponse } from "next/server";
import { withAuth } from "@/lib/http";
import { deleteNote, getNote, updateNote } from "@/lib/services/notes";
import { updateNoteSchema } from "@/lib/validators";

type Params = { id: string };

export const GET = withAuth<Params>(async (_req, { userId, params }) => {
  return NextResponse.json({ note: await getNote(userId, params.id) });
});

export const PATCH = withAuth<Params>(async (req, { userId, params }) => {
  const body = updateNoteSchema.parse(await req.json());
  return NextResponse.json({ note: await updateNote(userId, params.id, body) });
});

export const DELETE = withAuth<Params>(async (_req, { userId, params }) => {
  await deleteNote(userId, params.id);
  return new NextResponse(null, { status: 204 });
});
