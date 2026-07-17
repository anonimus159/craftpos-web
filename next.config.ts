import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.RENDER ? undefined : 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

