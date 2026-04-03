import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (
    pathname === "/landing" ||
    pathname === "/login" ||
    pathname.startsWith("/u/") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  if (!req.auth && pathname === "/") {
    return NextResponse.redirect(new URL("/landing", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};