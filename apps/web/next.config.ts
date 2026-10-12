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
      // Allow example.com for placeholder/test listing images
      {
        protocol: "https",
        hostname: "example.com",
      },
    ],
  },
  // The blog was renamed "The Nurture Journal" and moved to /journal. These are
  // real 308s issued before rendering begins — unlike the in-post slug renames
  // (see CLAUDE.md, Blog QA pass #4), which can only meta-refresh because the
  // root loading.tsx streams the response before the slug lookup resolves. A
  // static path rewrite needs no lookup, so it can be answered by the router.
  async redirects() {
    return [
      { source: "/blog", destination: "/journal", permanent: true },
      { source: "/blog/:slug", destination: "/journal/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
