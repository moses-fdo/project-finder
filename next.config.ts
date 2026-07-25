import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:*', '127.0.0.1:*'],
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' data:; object-src 'none'; base-uri 'self'; form-action 'self';",
  },
  reactStrictMode: true,
  compiler: {
    reactRemoveProperties: true,
    removeConsole: process.env.NODE_ENV === 'production',
  },
  output: 'standalone',
};

export default nextConfig;
