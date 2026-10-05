import { NextResponse } from "next/server";
import { withAuth } from "@/lib/http";
import { removeManualLink } from "@/lib/services/thoughts";

export const DELETE = withAuth<{ id: string; linkId: string }>(async (_req, { userId, params }) => {
  await removeManualLink(userId, params.id, params.linkId);
  return new NextResponse(null, { status: 204 });
});
