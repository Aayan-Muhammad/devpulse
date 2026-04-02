import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (!req.auth && pathname === "/") {
    return NextResponse.redirect(new URL("/landing", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/((?!api(?:/|$)|_next/static|_next/image|favicon.ico|login(?:/|$)|landing(?:/|$)|u(?:/|$)).*)",
  ],
};
