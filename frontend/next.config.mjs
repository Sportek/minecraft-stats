/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for optimized Docker builds
  output: "standalone",

  images: {
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
