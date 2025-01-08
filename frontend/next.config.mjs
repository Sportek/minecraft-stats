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
      { hostname: "*.tenor.com" },
    ],
    formats: ["image/webp"],
  },
};

export default nextConfig;
