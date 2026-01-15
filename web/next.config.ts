import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { externalDir: true },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
};

export default nextConfig;
