/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack is the default in Next 16. An empty config acknowledges it, so
  // the `webpack` block below does not trip Next's "webpack config with no
  // turbopack config" error.
  turbopack: {},

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
