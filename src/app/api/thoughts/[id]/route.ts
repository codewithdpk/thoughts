import { NextResponse } from "next/server";
import { withAuth } from "@/lib/http";
import { deleteThought, getThought, updateThought } from "@/lib/services/thoughts";
import { updateThoughtSchema } from "@/lib/validators";

type Params = { id: string };

export const GET = withAuth<Params>(async (_req, { userId, params }) => {
  return NextResponse.json({ thought: await getThought(userId, params.id) });
});

export const PATCH = withAuth<Params>(async (req, { userId, params }) => {
  const body = updateThoughtSchema.parse(await req.json());
  return NextResponse.json({ thought: await updateThought(userId, params.id, body) });
});

export const DELETE = withAuth<Params>(async (_req, { userId, params }) => {
  await deleteThought(userId, params.id);
  return new NextResponse(null, { status: 204 });
});
