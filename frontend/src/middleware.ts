import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  // Expose the incoming path to generateMetadata (hreflang/canonical), which has
  // no other access to the request pathname.
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  // Skip API routes, Next internals, and anything with a file extension. The
  // `.*\\..*` clause keeps the locale-agnostic metadata routes (sitemap.xml,
  // robots.txt, feed.xml, manifest.webmanifest, favicon.ico) and /images/* out
  // of the locale rewrite.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
