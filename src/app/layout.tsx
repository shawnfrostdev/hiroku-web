import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import { MonatagOnclick } from "@/components/MonatagOnclick";
import { Navbar } from "@/components/Navbar";
import QueryProvider from "@/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hiroku - Premium Anime Streaming",
  description: "High-performance, community-driven anime streaming platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="min-h-full flex flex-col" suppressHydrationWarning>
          <QueryProvider>
            <Navbar />
            {children}
            <Footer />
          </QueryProvider>
          <Analytics />
          {/* Monetag Onclick ad — loaded once for the entire app lifecycle */}
          <MonatagOnclick />
          {/* Monetag Multitag (Fair Tag) — zone 260580 */}
          <Script
            id="monetag-multitag"
            src="https://quge5.com/88/tag.min.js"
            data-zone="260580"
            async
            data-cfasync="false"
            strategy="afterInteractive"
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
