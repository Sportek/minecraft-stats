import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlProxy = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const response = intlProxy(request);
  // Expose the incoming path to generateMetadata (hreflang/canonical), which has
  // no other access to the request pathname.
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  // Skip API routes, Next internals, and real asset files. We exclude only known
  // asset extensions (not any dot) so the locale-agnostic metadata routes
  // (sitemap.xml, robots.txt, feed.xml, manifest.webmanifest, favicon.ico) and
  // /images/* stay out of the locale rewrite — while server URLs whose slug looks
  // like a domain (e.g. /servers/12/penguin.gg) still reach the locale handling
  // and the canonical-slug redirect instead of 404ing.
  matcher: [
    "/((?!api|_next|_vercel|.*\\.(?:xml|txt|webmanifest|ico|png|jpe?g|svg|webp|gif|json|js|css|woff2?|ttf|eot|map|pdf)$).*)",
  ],
};
