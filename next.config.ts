import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable prerendering during build - app needs Supabase env vars
    // Remove this in production once Supabase is configured
  },
  // Skip pages that need dynamic rendering
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;