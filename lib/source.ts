import { llms, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { basePath, docsRoute, siteUrl } from './shared';
import { defineDocs } from 'fumadocs-mdx/macro';
import { createElement } from 'react';
import { Database, HardDrive, LayoutDashboard } from 'lucide-react';
import type { Folder, Node } from 'fumadocs-core/page-tree';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// Pages and sections grouped under Platform, in this order. A section matches by its overview page's URL.
const PLATFORM_URLS = ['/', '/quickstart', '/canvas', '/how-it-works', '/sign-in', '/projects', '/billing', '/support'];
const nodeUrl = (n: Node) => (n.type === 'page' ? n.url : n.type === 'folder' ? n.index?.url : undefined);

// Data & storage is shown as two sections, Databases and Volumes (URLs unchanged under /data).
function splitData(children: Node[]): Node[] {
  return children.flatMap((n): Node[] => {
    if (n.type !== 'folder' || n.index?.url !== '/data') return [n];
    const volumes = n.children.find((c) => nodeUrl(c) === '/data/volumes');
    const databases: Folder = {
      $id: 'databases',
      type: 'folder',
      name: 'Databases',
      icon: createElement(Database),
      index: n.index && { ...n.index, name: 'Overview' },
      // The engine pages are listed directly; the console and environment backups follow them.
      children: n.children
        .filter((c) => c !== volumes)
        .flatMap((c): Node[] => (c.type === 'folder' && !c.index ? c.children : [c])),
    };
    return volumes?.type === 'folder' ? [databases, { ...volumes, icon: createElement(HardDrive) }] : [databases];
  });
}

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [
    lucideIconsPlugin(),
    {
      // The home page keeps its "StackBlaze Docs" heading; the sidebar calls it Home.
      transformPageTree: {
        file(node, filePath) {
          if (filePath === 'index.mdx') return { ...node, name: 'Home' };
          if (filePath === 'projects/index.mdx') return { ...node, name: 'Projects' };
          return node;
        },
        // The loose top-level pages and the pages of Projects & teams and Billing sit together in one Platform section (URLs unchanged).
        root(root) {
          const isPlatform = (n: Node) => PLATFORM_URLS.includes(nodeUrl(n) ?? '');
          const platform: Folder = {
            $id: 'platform',
            type: 'folder',
            name: 'Platform',
            icon: createElement(LayoutDashboard),
            // Sections are flattened: their overview page and pages are listed directly under Platform.
            children: PLATFORM_URLS.flatMap((u) =>
              root.children
                .filter((n) => nodeUrl(n) === u)
                .flatMap((n): Node[] => (n.type === 'folder' ? [...(n.index ? [n.index] : []), ...n.children] : [n])),
            ),
          };
          return { ...root, children: [platform, ...splitData(root.children.filter((n) => !isPlatform(n)))] };
        },
      },
    },
  ],
});

export const docsLlms = llms(source, {
  // Links in llms.txt are absolute: the app runs under /docs on www.stackblaze.com.
  renderUrl: (item) => `${siteUrl}${basePath}${item.url}`,
  renderPage: async (page) => `# ${page.data.title} (${siteUrl}${basePath}${page.url === '/' ? '' : page.url})

${await page.data.getText('processed')}`,
});
