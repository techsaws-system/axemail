import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { APP_ROUTE, AUTH_COOKIE, ROLE } from "./constants/enums";

const protectedRoutes = [
  APP_ROUTE.OVERVIEW,
  APP_ROUTE.LIMIT_USAGE,
  APP_ROUTE.GMAIL_SENDER,
  APP_ROUTE.DOMAIN_SENDER,
  APP_ROUTE.MASK_SENDER,
  APP_ROUTE.TEMPLATE_SENDER,
  APP_ROUTE.ACCOUNTS,
  APP_ROUTE.SMTP_MANAGEMENT,
  APP_ROUTE.SETTINGS,
];

const adminRoutes = [APP_ROUTE.SMTP_MANAGEMENT];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const accessToken = request.cookies.get(AUTH_COOKIE.ACCESS_TOKEN)?.value;
  const role = request.cookies.get(AUTH_COOKIE.ROLE)?.value;
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (pathname === APP_ROUTE.LOGIN && accessToken) {
    return NextResponse.redirect(new URL(APP_ROUTE.OVERVIEW, request.url));
  }

  if (isProtectedRoute && !accessToken) {
    return NextResponse.redirect(new URL(APP_ROUTE.LOGIN, request.url));
  }

  if (isAdminRoute && role !== ROLE.ADMIN) {
    return NextResponse.redirect(new URL(APP_ROUTE.OVERVIEW, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/overview/:path*",
    "/limit-usage/:path*",
    "/gmail-sender/:path*",
    "/domain-sender/:path*",
    "/mask-sender/:path*",
    "/template-sender/:path*",
    "/accounts-management/:path*",
    "/smtp-management/:path*",
    "/settings/:path*",
  ],
};
