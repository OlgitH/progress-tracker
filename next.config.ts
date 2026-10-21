import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Goal pages used to live at the top level; keep old bookmarks working.
  async redirects() {
    return [
      { source: "/goals", destination: "/my-goals/edit", permanent: true },
      { source: "/new", destination: "/my-goals/updates/new", permanent: true },
      { source: "/progress/:year", destination: "/my-goals/progress/:year", permanent: true },
    ];
  },
};

export default nextConfig;
