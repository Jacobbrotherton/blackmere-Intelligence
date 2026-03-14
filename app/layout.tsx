import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "M&A Deal Tracker",
  description: "Mergers · Acquisitions · Divestitures",
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
      <body className="font-sans text-ft-black">{children}</body>
    </html>
  );
}
