import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Files in public/ are served with `max-age=0` by default, so every visit re-checks every picture.
  // Game art changes rarely: let browsers keep it for a day, and keep using it for a week while a
  // fresh copy is fetched in the background. (Names aren't content-hashed, so not `immutable`.)
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
