import "@/env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@ea/ui"],
  images: {
    remotePatterns: [
      { hostname: "imagedelivery.net" },
      { hostname: "img.clerk.com" },
    ],
  },
};

export default nextConfig;
