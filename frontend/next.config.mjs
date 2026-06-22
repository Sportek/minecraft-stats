// Allow Next's image optimizer to fetch from the S3/CloudFront assets host when
// one is configured (server favicons point there in production).
const assetsUrl = process.env.NEXT_PUBLIC_ASSETS_URL;
const assetsRemotePattern = assetsUrl ? [{ hostname: new URL(assetsUrl).hostname }] : [];

// Content-Security-Policy in REPORT-ONLY mode: it never blocks anything, it only
// reports violations to the console. This is the safe first step toward enforcing
// a CSP — it lets us discover what the real third parties (GTM/GA, Clarity, Umami,
// Cloudflare Insights/Zaraz, Turnstile, S3 assets) actually need before flipping
// to an enforced policy (which would require script nonces to be truly effective).
// `'unsafe-inline'`/`'unsafe-eval'` are kept for now because Next's inline bootstrap
// and GTM rely on them; tightening them is the follow-up nonce work.
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.google-analytics.com https://*.clarity.ms https://*.umami.is https://static.cloudflareinsights.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "frame-src 'self' https://challenges.cloudflare.com https://www.googletagmanager.com",
  "worker-src 'self' blob:",
  // api.iconify.design (+ its fallback hosts) is hit at runtime by @iconify/react
  // to fetch icon data.
  "connect-src 'self' https://*.google-analytics.com https://*.clarity.ms https://*.umami.is https://static.cloudflareinsights.com https://challenges.cloudflare.com https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com https://*.minecraft-stats.fr https://*.minecraft-stats.com https://*.amazonaws.com",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for optimized Docker builds
  output: "standalone",

  images: {
    // En dev, le backend local sert les images depuis http://localhost:9000, qui
    // résout vers une IP privée (::1/127.0.0.1). Next 16 bloque l'optimisation de
    // ces sources (protection SSRF). On désactive donc l'optimiseur en dev pour
    // servir les images directement ; la prod garde l'optimisation complète.
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "cdn.discordapp.com" },
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "localhost" },
      { hostname: "localhost", port: "9000" },
      { hostname: "127.0.0.1" },
      { hostname: "127.0.0.1", port: "9000" },
      { hostname: "api.minecraft-stats.fr" },
      { hostname: "api.minecraft-stats.com" },
      { hostname: "*.tenor.com" },
      { hostname: "api-staging.minecraft-stats.fr" },
      { hostname: "api-staging.minecraft-stats.com" },
      { hostname: "api-prod.minecraft-stats.fr" },
      { hostname: "api-prod.minecraft-stats.com" },
      { hostname: "upload.wikimedia.org" },
      { hostname: "i.imgur.com" },
      { hostname: "picsum.photos" },
      ...assetsRemotePattern,
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
    deviceSizes: [48, 96, 128, 256, 384, 512, 640, 750, 828, 1080, 1200],
    imageSizes: [48, 96, 128, 256, 384],
  },
  // Optimisations de performance
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["@iconify/react"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
        ],
      },
    ];
  },
};

export default nextConfig;
