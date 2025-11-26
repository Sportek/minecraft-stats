/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "cdn.discordapp.com" },
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "localhost" },
      { hostname: "127.0.0.1" },
      { hostname: "api.minecraft-stats.fr" },
      { hostname: "api.minecraft-stats.com" },
      { hostname: "*.tenor.com" },
      { hostname: "api-staging.minecraft-stats.fr" },
      { hostname: "api-staging.minecraft-stats.com" },
    ],
    formats: ["image/webp"],
    minimumCacheTTL: 2678400,
    deviceSizes: [48, 96, 128, 256, 384, 512, 640, 750, 828, 1080, 1200],
    imageSizes: [48, 96, 128, 256, 384],
  },
  // Optimisations de performance
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["@iconify/react"],
  },
};

export default nextConfig;
