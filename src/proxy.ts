import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = ["/", "/api/auth"];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public profile pages (GET /profile/:username) are intentionally
  // viewable without signing in; visibility is enforced server-side.
  const isPublicProfileView =
    pathname.startsWith("/profile/") && !pathname.endsWith("/edit");

  if (req.auth || isPublicPath(pathname) || isPublicProfileView) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signInUrl = new URL("/", req.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
