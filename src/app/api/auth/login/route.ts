import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password } = body;

  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: "Nesprávné heslo" }, { status: 401 });
  }

  const token = await createSessionCookie();
  const response = NextResponse.json({ success: true });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
