// Allow Next's image optimizer to fetch from the S3/CloudFront assets host when
// one is configured (server favicons point there in production).
const assetsUrl = process.env.NEXT_PUBLIC_ASSETS_URL;
const assetsRemotePattern = assetsUrl ? [{ hostname: new URL(assetsUrl).hostname }] : [];

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
        ],
      },
    ];
  },
};

export default nextConfig;
