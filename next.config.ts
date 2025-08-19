import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "imagedelivery.net" },
      { hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
