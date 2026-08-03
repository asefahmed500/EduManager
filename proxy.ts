import { NextResponse, type NextRequest } from "next/server";

import { decrypt, SESSION_COOKIE } from "@/lib/jwt";
import { ROLE_DASHBOARD } from "@/lib/roles";
import type { Role } from "@/lib/generated/prisma/client";

function roleArea(pathname: string): Role | null {
  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/teacher")) return "TEACHER";
  if (pathname.startsWith("/student")) return "STUDENT";
  return null;
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes enforce authentication themselves.
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await decrypt(token);
  const area = roleArea(pathname);

  // Unauthenticated: protect role areas, leave public routes alone.
  if (!session) {
    if (area || pathname === "/notifications") {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const home = ROLE_DASHBOARD[session.role];

  // Authenticated user visiting auth pages -> bounce to their dashboard.
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    const url = req.nextUrl.clone();
    url.pathname = home;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Role mismatch (e.g. student opening /admin) -> send to own dashboard.
  if (area && area !== session.role) {
    const url = req.nextUrl.clone();
    url.pathname = home;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|robots.txt|sitemap.xml).*)",
  ],
};
