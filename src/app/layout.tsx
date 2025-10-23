import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ReactQueryProvider from "@/components/react-query-provider";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Header } from "@/components/app-header";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as JotaiProvider } from "jotai";
import { WebVitals } from "@/lib/axiom/client";
import { format } from "date-fns";

const interSans = Inter({
  variable: "--font-inter-sans",
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
          <body className={`${interSans.variable} antialiased bg-gray-50`}>
            <JotaiProvider>
              <Header />
              {children}
              <div className="p-10 bg-primary text-primary-foreground">
                © {format(new Date(), "yyyy")} Eat Authentically. Discover
                authentic food experiences.
              </div>
            </JotaiProvider>
            <Toaster />
            <SpeedInsights />
            <Analytics />
            <WebVitals />
            <ReactQueryDevtools />
          </body>
        </html>
      </ReactQueryProvider>
    </ClerkProvider>
  );
}
