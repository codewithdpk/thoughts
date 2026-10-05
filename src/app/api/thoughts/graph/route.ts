import { NextResponse } from "next/server";
import { withAuth } from "@/lib/http";
import { getGraph } from "@/lib/services/thoughts";

export const GET = withAuth(async (_req, { userId }) => {
  return NextResponse.json(await getGraph(userId));
});
