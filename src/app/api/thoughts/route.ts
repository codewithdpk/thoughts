import { NextResponse } from "next/server";
import { withAuth } from "@/lib/http";
import { createThought, listThoughts } from "@/lib/services/thoughts";
import { createDocSchema } from "@/lib/validators";

export const GET = withAuth(async (req, { userId }) => {
  const params = req.nextUrl.searchParams;
  const search = params.get("search")?.trim() || undefined;
  const limit = Number(params.get("limit")) || undefined;
  return NextResponse.json({ thoughts: await listThoughts(userId, search, limit) });
});

export const POST = withAuth(async (req, { userId }) => {
  const body = createDocSchema.parse(await req.json().catch(() => ({})));
  return NextResponse.json({ thought: await createThought(userId, body) }, { status: 201 });
});
