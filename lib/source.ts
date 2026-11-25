import { llms, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { basePath, docsRoute, siteUrl } from './shared';
import { defineDocs } from 'fumadocs-mdx/macro';
import { createElement } from 'react';
import { LayoutDashboard } from 'lucide-react';
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
          return filePath === 'index.mdx' ? { ...node, name: 'Home' } : node;
        },
        // The loose top-level pages, Projects & teams and Billing sit together in one Platform section (URLs unchanged).
        root(root) {
          const isPlatform = (n: Node) => PLATFORM_URLS.includes(nodeUrl(n) ?? '');
          const platform: Folder = {
            $id: 'platform',
            type: 'folder',
            name: 'Platform',
            icon: createElement(LayoutDashboard),
            children: PLATFORM_URLS.flatMap((u) => root.children.filter((n) => nodeUrl(n) === u)),
          };
          return { ...root, children: [platform, ...root.children.filter((n) => !isPlatform(n))] };
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
