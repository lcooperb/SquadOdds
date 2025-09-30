import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navigation from "@/components/Navigation";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  // Update this to your production domain
  metadataBase: new URL('https://squadodds.vercel.app'),
  title: "SquadOdds - Call it, before life does.",
  description: "A prediction market for your squad to bet on personal life events",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/icons/safari-pinned-tab.svg" }],
  },
  openGraph: {
    title: "SquadOdds - Call it, before life does.",
    description: "A prediction market for your squad to bet on personal life events",
    url: "https://squadodds.vercel.app",
    siteName: "SquadOdds",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "SquadOdds - Call it, before life does."
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SquadOdds - Call it, before life does.",
    description: "A prediction market for your squad to bet on personal life events",
    images: ["/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        <Providers>
          <div className="min-h-screen bg-gray-900">
            <Navigation />
            <div className="pt-16">{children}</div>
          </div>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
