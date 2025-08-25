import type { NextConfig } from "next";
import "@/env";

const cspHeader = `
    default-src 'self' http://localhost:3000 https://patient-minnow-5.clerk.accounts.dev;
    script-src 'self' http://localhost:3000 https://va.vercel-scripts.com https://patient-minnow-5.clerk.accounts.dev 'unsafe-inline' 'unsafe-eval' blob:;
    style-src 'self' http://localhost:3000 https://patient-minnow-5.clerk.accounts.dev 'unsafe-inline';
    img-src 'self' http://localhost:3000 https://patient-minnow-5.clerk.accounts.dev blob: data:;
    media-src 'self' blob:http://localhost:3000 blob:;
    font-src 'self' http://localhost:3000 https://patient-minnow-5.clerk.accounts.dev;
    object-src 'none';
    base-uri 'self' http://localhost:3000 https://patient-minnow-5.clerk.accounts.dev;
    form-action 'self' http://localhost:3000 https://patient-minnow-5.clerk.accounts.dev;
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  // async headers() {
  //   return [
  //     {
  //       source: "/(.*)",
  //       headers: [
  //         {
  //           key: "Content-Security-Policy",
  //           value: cspHeader.replace(/\n/g, ""),
  //           // value: "default-src * 'unsafe-inline' 'unsafe-eval' blob: data:",
  //         },
  //       ],
  //     },
  //   ];
  // },
  images: {
    remotePatterns: [
      { hostname: "imagedelivery.net" },
      { hostname: "images.unsplash.com" },
      { hostname: "img.clerk.com" },
    ],
  },
};

export default nextConfig;
