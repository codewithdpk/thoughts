import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifyJwt } from "@/lib/jwt";

// Page-level guard only. API routes verify the JWT themselves and return 401 JSON.
export async function proxy(req: NextRequest) {
  const session = await verifyJwt(req.cookies.get(AUTH_COOKIE)?.value);
  const isLogin = req.nextUrl.pathname === "/login";

  if (!session && !isLogin) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  if (session && isLogin) return NextResponse.redirect(new URL("/notes", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico|webp)$).*)"],
};
