/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to THIS directory.
  //
  // Next infers the root from the nearest lockfile, so a stray package-lock.json
  // in any parent folder makes Turbopack watch that whole tree — on macOS that
  // can mean the entire home directory, including iCloud-synced files. The
  // result is a rebuild loop that floods the terminal and pins the CPU.
  //
  // Pinning it also acknowledges Turbopack (the Next 16 default), so the
  // `webpack` block below does not trip the "webpack config with no turbopack
  // config" error.
  turbopack: {
    root: import.meta.dirname,
  },

  // Generated articles and their covers are written into the project at
  // runtime; without this, each generation triggers a dev rebuild and a
  // browser reload. Only applies to `npm run dev:webpack`, which exists as an
  // alternative bundler when Turbopack misbehaves — measured memory use is
  // comparable, so it is not a fix for a low-RAM machine.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules/**', '**/.git/**', '**/content/posts/**', '**/public/blog/**'],
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.imgur.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
