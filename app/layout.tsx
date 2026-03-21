import type { Metadata } from "next";
import "./globals.css";
import { SubscriptionProvider } from "@/lib/subscription-context";
import { AuthProvider } from "@/lib/auth-context";
import { DealAnalystChat } from "@/components/ui/deal-analyst-chat";

export const metadata: Metadata = {
  title: "Blackmere Intelligence | M&A Deal Tracker",
  description: "Blackmere Intelligence — your premier source for M&A deal tracking, merger rumours, acquisition intelligence, and live dealflow analysis.",
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
            <DealAnalystChat />
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
