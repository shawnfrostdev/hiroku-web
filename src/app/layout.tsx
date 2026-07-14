import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import Script from "next/script";
import { Footer } from "@/components/Footer";
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
          <Script
            src="https://3nbf4.com/act/files/micro.tag.min.js?z=11287355"
            strategy="lazyOnload"
            data-cfasync="false"
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
