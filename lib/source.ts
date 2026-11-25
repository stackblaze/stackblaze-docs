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

const PLATFORM_URLS = ['/', '/quickstart', '/canvas', '/how-it-works', '/sign-in', '/support'];

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
        // The loose top-level pages sit together in one Platform section (URLs unchanged).
        root(root) {
          const isPlatform = (n: Node) => n.type === 'page' && PLATFORM_URLS.includes(n.url);
          const platform: Folder = {
            $id: 'platform',
            type: 'folder',
            name: 'Platform',
            icon: createElement(LayoutDashboard),
            children: PLATFORM_URLS.flatMap((u) => root.children.filter((n) => n.type === 'page' && n.url === u)),
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
