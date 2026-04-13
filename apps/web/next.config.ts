import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: resolve(__dirname, "../../"),
  transpilePackages: [
    "@multacheck/core",
    "@multacheck/db",
    "@multacheck/ui",
    "@multacheck/sanity-schemas",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "kviwyswvmygxkngfssqz.supabase.co" },
    ],
  },
};

export default nextConfig;
