import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals, and anything with a file extension. The
  // `.*\\..*` clause keeps the locale-agnostic metadata routes (sitemap.xml,
  // robots.txt, feed.xml, manifest.webmanifest, favicon.ico) and /images/* out
  // of the locale rewrite.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
