import type { NextConfig } from "next";
import path from "path";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sofifa.net" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
      { protocol: "https", hostname: "media.futdb.app" },
    ],
  },
  async rewrites() {
    return [
      {
        // Proxy all /api/* requests to the backend EXCEPT the image-proxy
        // which is handled by the Next.js API route itself
        source: "/api/:path((?!image-proxy).*)",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
