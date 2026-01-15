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

  // 将 /api/* 请求代理到宝塔后端服务器
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://182.92.203.173:4000/:path*',
      },
    ];
  },
};

export default nextConfig;
