import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getSessionFromRequest } from "./auth";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what = "Resource") => new HttpError(404, `${what} not found`);

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "Invalid request", issues: err.issues }, { status: 400 });
  }
  if (err instanceof SyntaxError) {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

type AuthedContext<P> = { userId: string; params: P };

/**
 * Wraps a route handler: verifies the JWT (401 otherwise), resolves params,
 * and maps thrown HttpError/ZodError to JSON responses.
 */
export function withAuth<P extends Record<string, string> = Record<string, never>>(
  handler: (req: NextRequest, ctx: AuthedContext<P>) => Promise<Response>,
) {
  return async (req: NextRequest, ctx: { params: Promise<P> }) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const params = ((await ctx?.params) ?? {}) as P;
      return await handler(req, { userId: session.userId, params });
    } catch (err) {
      return errorResponse(err);
    }
  };
}
