import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, verifyJwt, type Session } from "./jwt";

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

/** API requests: `Authorization: Bearer <jwt>` first, then the httpOnly cookie. */
export async function getSessionFromRequest(req: NextRequest): Promise<Session | null> {
  const header = req.headers.get("authorization");
  const bearer = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
  return verifyJwt(bearer ?? req.cookies.get(AUTH_COOKIE)?.value);
}

/** Server components / layouts: read the session from the cookie. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifyJwt(store.get(AUTH_COOKIE)?.value);
}
