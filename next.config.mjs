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
  // Pages moved in the sidebar reorganization keep their old addresses.
  async redirects() {
    return [
      { source: '/ai', destination: '/ai/coding-tools', permanent: true },
      { source: '/ai/agent-channels', destination: '/ai/agents/channels', permanent: true },
      { source: '/ai/agent-evals', destination: '/ai/agents/evals', permanent: true },
      { source: '/ai/agent-knowledge-and-skills', destination: '/ai/agents/knowledge', permanent: true },
      { source: '/ai/agent-settings', destination: '/ai/agents/run', permanent: true },
      { source: '/backups', destination: '/data/environment-backups', permanent: true },
      { source: '/configure/basic-auth', destination: '/networking/basic-auth', permanent: true },
      { source: '/configure/custom-domains', destination: '/networking/custom-domains', permanent: true },
      { source: '/configure/networking', destination: '/networking/advanced-networking', permanent: true },
      { source: '/configure/service-settings', destination: '/configure', permanent: true },
      { source: '/configure/tracing-and-log-retention', destination: '/observe/tracing-and-log-retention', permanent: true },
      { source: '/configure/visibility', destination: '/networking/visibility', permanent: true },
      { source: '/configure/volume-files', destination: '/data/volumes/browse-files', permanent: true },
      { source: '/configure/volumes', destination: '/data/volumes', permanent: true },
      { source: '/configure/vulnerability-scans', destination: '/security/vulnerability-scans', permanent: true },
      { source: '/databases/backups', destination: '/data/databases/backups', permanent: true },
      { source: '/databases/mariadb', destination: '/data/databases/mariadb', permanent: true },
      { source: '/databases/postgresql', destination: '/data/databases/postgresql', permanent: true },
      { source: '/databases/valkey', destination: '/data/databases/valkey', permanent: true },
      { source: '/deploy-docker-image', destination: '/build-deploy/deploy-docker-image', permanent: true },
      { source: '/deploy-from-github', destination: '/build-deploy/deploy-from-github', permanent: true },
      { source: '/functions', destination: '/build-deploy/functions', permanent: true },
      { source: '/import', destination: '/build-deploy/import', permanent: true },
      { source: '/observe/deployments', destination: '/build-deploy/deployments', permanent: true },
      { source: '/projects/infrastructure-as-code', destination: '/build-deploy/infrastructure-as-code', permanent: true },
      { source: '/projects/preview-environments', destination: '/build-deploy/preview-environments', permanent: true },
      { source: '/sandboxes', destination: '/build-deploy/developer-sandbox', permanent: true },
      { source: '/team/account-security', destination: '/security/account-security', permanent: true },
      { source: '/team/api-tokens', destination: '/security/api-tokens', permanent: true },
      { source: '/team/audit-log', destination: '/security/audit-log', permanent: true },
      { source: '/team/integrations', destination: '/projects/integrations', permanent: true },
      { source: '/team/members-and-roles', destination: '/projects/members-and-roles', permanent: true },
      { source: '/team/sign-in', destination: '/sign-in', permanent: true },
      { source: '/team/ssh-keys', destination: '/security/ssh-keys', permanent: true },
      { source: '/team/support', destination: '/support', permanent: true },
      { source: '/templates', destination: '/build-deploy/templates', permanent: true },
      { source: '/templates/deploy', destination: '/build-deploy/templates/deploy', permanent: true },
      { source: '/templates/saved-stacks', destination: '/build-deploy/templates/saved-stacks', permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: '/:path*.md', destination: '/llms.mdx/:path*.md' },
    ];
  },
};

export default withMDX(config);
