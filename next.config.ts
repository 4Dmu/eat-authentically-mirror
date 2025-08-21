import type { NextConfig } from "next";
import "@/env";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "imagedelivery.net" },
      { hostname: "images.unsplash.com" },
      { hostname: "img.clerk.com" },
    ],
  },
};

export default nextConfig;
