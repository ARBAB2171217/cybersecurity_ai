import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("cybershield_access_token")?.value;
  const { pathname } = request.nextUrl;

  // Allow next _next and api requests
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/favicon.ico")) {
    return NextResponse.next();
  }

  // Redirect legacy /login and /register routes to landing page with modal trigger parameters
  if (pathname === "/login") {
    const url = new URL("/", request.url);
    url.searchParams.set("auth", "login");
    return NextResponse.redirect(url);
  }
  if (pathname === "/register") {
    const url = new URL("/", request.url);
    url.searchParams.set("auth", "register");
    return NextResponse.redirect(url);
  }

  const publicRoutes = ["/", "/forgot-password", "/reset-password", "/verify-email"];
  const isPublicRoute = publicRoutes.some((route) => 
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  );

  // Redirect unauthenticated users
  if (!token && !isPublicRoute) {
    const url = new URL("/", request.url);
    url.searchParams.set("auth", "login");
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

function getRoleFromToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(decoded);
    return data.role || null;
  } catch {
    return null;
  }
}

  const role = token ? getRoleFromToken(token) : null;

  // Prevent regular users from accessing admin routes
  if (token && pathname.startsWith("/admin") && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Prevent admins from accessing user routes (optional, but good practice, let's just protect admin routes)
  if (token && pathname.startsWith("/dashboard") && (role === "ADMIN" || role === "SUPER_ADMIN")) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // Redirect authenticated users trying to access public auth forms or landing page to their default dashboard
  if (token && (pathname === "/" || pathname === "/forgot-password" || pathname === "/reset-password")) {
    const role = getRoleFromToken(token);
    const dest = role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
