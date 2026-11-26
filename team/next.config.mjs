import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // The public website lives one folder up with its own lockfile.
  turbopack: { root },
  outputFileTracingRoot: root,
  experimental: {
    // Project deliverables (photos, video cuts) are uploaded through server actions.
    serverActions: { bodySizeLimit: "250mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          // A private staff app: keep it out of search engines entirely.
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};
export default nextConfig;
