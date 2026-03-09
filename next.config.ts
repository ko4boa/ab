import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: process.env.VERCEL ? ".next" : ".next.nosync",
};

export default nextConfig;
