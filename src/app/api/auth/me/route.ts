import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, notFound } from "@/lib/http";

export const GET = withAuth(async (_req, { userId }) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) throw notFound("User");
  return NextResponse.json({ user });
});
