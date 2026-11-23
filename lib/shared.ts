import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'StackBlaze Docs';
// The app runs under basePath '/docs' (next.config.mjs), served at
// www.stackblaze.com/docs. Routes inside the app start at '/'.
export const basePath = '/docs';
export const siteUrl = 'https://www.stackblaze.com';
export const dashboardUrl = 'https://dashboard.stackblaze.com';
export const docsRoute = '/';
export const docsImageRoute = '/og/pages';

export const gitConfig = {
  user: 'stackblaze',
  repo: 'stackblaze-docs',
  branch: 'main',
};

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: getImageUrl(segments, page.locale) };
}
