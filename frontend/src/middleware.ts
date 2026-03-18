import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const accessToken = request.cookies.get("accessToken");

    const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
    const isLoginRoute = request.nextUrl.pathname === "/";

    if (!accessToken && isDashboardRoute) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    if (accessToken && isLoginRoute) {
        return NextResponse.redirect(
            new URL("/dashboard/overview", request.url)
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/"],
};
