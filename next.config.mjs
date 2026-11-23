import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Served at www.stackblaze.com/docs: the website forwards /docs/* here, so
  // pages, assets (/docs/_next) and the search API all live under /docs.
  basePath: '/docs',
  output: 'standalone',
  images: { unoptimized: true },
  async rewrites() {
    return [
      { source: '/:path*.md', destination: '/llms.mdx/:path*.md' },
    ];
  },
};

export default withMDX(config);
