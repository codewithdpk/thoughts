import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt } from "jose";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { errorResponse, HttpError } from "@/lib/http";
import { AUTH_COOKIE, signJwt } from "@/lib/jwt";
import { loginSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = loginSchema.parse(await req.json());
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new HttpError(401, "Invalid email or password");
    }

    const token = await signJwt({ userId: user.id, email: user.email });
    const { exp } = decodeJwt(token);
    const res = NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: exp ? new Date(exp * 1000) : undefined,
    });
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
