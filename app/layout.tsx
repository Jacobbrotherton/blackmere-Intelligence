import type { Metadata } from "next";
import "./globals.css";
import { SubscriptionProvider } from "@/lib/subscription-context";
import { AuthProvider } from "@/lib/auth-context";

const BASE_URL = "https://blackmereintelligence.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Blackmere Intelligence | M&A Deal Tracker",
    template: "%s | Blackmere Intelligence",
  },
  description:
    "Blackmere Intelligence — live M&A deal tracking, merger rumours, acquisition intelligence and dealflow analysis across Technology, Healthcare, Energy, Financials, Industrials and Private Equity.",
  keywords: [
    "M&A tracker",
    "mergers and acquisitions",
    "deal tracker",
    "acquisition intelligence",
    "merger news",
    "private equity deals",
    "corporate finance",
    "dealflow",
    "buyout tracker",
    "M&A intelligence",
    "takeover tracker",
    "LBO tracker",
    "Blackmere Intelligence",
  ],
  authors: [{ name: "Blackmere Intelligence", url: BASE_URL }],
  creator: "Blackmere Intelligence",
  publisher: "Blackmere Intelligence",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "Blackmere Intelligence",
    title: "Blackmere Intelligence | M&A Deal Tracker",
    description:
      "Live M&A intelligence — mergers, acquisitions and divestitures tracked in real time across six global sectors.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Blackmere Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@BlackmereIntel",
    title: "Blackmere Intelligence | M&A Deal Tracker",
    description:
      "Live M&A intelligence — mergers, acquisitions and divestitures tracked in real time.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Source+Sans+3:wght@300;400;600&display=swap"
          rel="stylesheet"
        />

      </head>
      <body className="font-sans text-ft-black">
        <AuthProvider>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
