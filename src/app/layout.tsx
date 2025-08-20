import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ReactQueryProvider from "@/components/react-query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EatAuthentically",
  description: "Find authentic farms, restaurants and eateries.",
  icons: {
    apple: "/apple-touch-icon.png",
    other: [
      {
        sizes: "192x192",
        rel: "icon",
        type: "image/png",
        url: "/android-chrome-192x192.png",
      },
      {
        sizes: "512x512",
        rel: "icon",
        type: "image/png",
        url: "/android-chrome-512x512.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ReactQueryProvider>
        <html lang="en">
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            {children}
          </body>
        </html>
      </ReactQueryProvider>
    </ClerkProvider>
  );
}
