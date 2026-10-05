import { NextResponse } from "next/server";
import { withAuth } from "@/lib/http";
import { addManualLink } from "@/lib/services/thoughts";
import { createLinkSchema } from "@/lib/validators";

export const POST = withAuth<{ id: string }>(async (req, { userId, params }) => {
  const body = createLinkSchema.parse(await req.json());
  return NextResponse.json({ link: await addManualLink(userId, params.id, body) }, { status: 201 });
});
