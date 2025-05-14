import type { NextConfig } from "next";

/**
 * Next.js config with environment variables
 * See: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
};

export default nextConfig;
