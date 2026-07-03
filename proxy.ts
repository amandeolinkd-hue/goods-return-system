import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { allowedRolesFor, homePathForRole, type Role } from "@/lib/roles";

const { auth } = NextAuth(authConfig);

// Next.js 16 "proxy" convention (formerly "middleware"). Handles auth gating
// and role-based route protection at the edge.
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role as Role | undefined;

  const isLoginPage = nextUrl.pathname === "/login";

  // Not logged in -> allow only the login page, redirect everything else there.
  if (!isLoggedIn) {
    if (isLoginPage) return NextResponse.next();
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in but on the login page -> send to their home.
  if (isLoginPage && role) {
    return NextResponse.redirect(new URL(homePathForRole(role), nextUrl));
  }

  // Role-based route protection.
  const allowed = allowedRolesFor(nextUrl.pathname);
  if (allowed && role && !allowed.includes(role)) {
    return NextResponse.redirect(new URL(homePathForRole(role), nextUrl));
  }

  return NextResponse.next();
});

// Run on everything except static assets and Next internals.
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
