import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Ensure the service worker is served with the correct headers so
        // browsers accept it at root scope. Required for Monetag push ads.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            // Grants the SW permission to control the entire origin ("/"),
            // regardless of where the file is physically served from.
            key: "Service-Worker-Allowed",
            value: "/",
          },
          {
            // Prevent CDN/browser from caching a stale SW build.
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
