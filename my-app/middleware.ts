import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req: NextRequest) {
    const token = req.cookies.get("accessToken")?.value;
    const { pathname } = req.nextUrl;

    // Allow public routes
    if (pathname.startsWith("/login") || pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    // Redirect if not authenticated
    if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Validate token
    try {
        jwt.verify(token, process.env.JWT_SECRET!);
        return NextResponse.next();
    } catch {
        return NextResponse.redirect(new URL("/login", req.url));
    }
}

export const config = {
    matcher: ["/((?!_next|favicon.ico).*)"],
};
