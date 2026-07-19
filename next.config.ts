import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.RENDER ? undefined : 'export',
  images: {
    unoptimized: true,
  },
  ...(process.env.RENDER && {
    async redirects() {
      return [
        {
          source: '/',
          missing: [
            {
              type: 'query',
              key: 'demo',
              value: 'true',
            },
          ],
          destination: '/promo',
          permanent: false,
        },
      ];
    },
  }),
};

export default nextConfig;

