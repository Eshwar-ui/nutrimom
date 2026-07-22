import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Listing photos are hosted on Supabase Storage — the project ref varies
    // per environment/deployment, so this allows any Supabase Storage host
    // rather than hardcoding one project's hostname.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
