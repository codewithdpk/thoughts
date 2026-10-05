import { NextResponse } from "next/server";
import { withAuth } from "@/lib/http";
import { createNote, listNotes } from "@/lib/services/notes";
import { createDocSchema } from "@/lib/validators";

export const GET = withAuth(async (req, { userId }) => {
  const search = req.nextUrl.searchParams.get("search")?.trim() || undefined;
  return NextResponse.json({ notes: await listNotes(userId, search) });
});

export const POST = withAuth(async (req, { userId }) => {
  const body = createDocSchema.parse(await req.json().catch(() => ({})));
  return NextResponse.json({ note: await createNote(userId, body) }, { status: 201 });
});
