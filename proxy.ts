import { NextRequest, NextResponse } from 'next/server';
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';

// Clients that ask for Markdown (Accept: text/markdown) get the page's .md.
// next.config.mjs maps /<page>.md to the llms.mdx route, so rewrite to that.
const { rewrite: rewriteDocs } = rewritePath('{/*path}', '{/*path}.md');

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const result =
    isMarkdownPreferred(request) && !/\.(md|txt)$/.test(pathname) && rewriteDocs(pathname);

  if (result) {
    const url = request.nextUrl.clone();
    // The docs home is served as /index.md.
    url.pathname = result === '.md' || result === '/.md' ? '/index.md' : result;
    return NextResponse.rewrite(url, { headers: { Vary: 'Accept' } });
  }

  return NextResponse.next();
}
