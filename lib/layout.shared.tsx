import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { dashboardUrl, siteUrl } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/docs/logo.svg" alt="" className="h-6 w-auto" />
          <span>StackBlaze</span>
          <span className="font-normal text-fd-muted-foreground">Docs</span>
        </span>
      ),
      // The docs home is /docs; plain <a> so it isn't prefixed twice.
      url: '/',
    },
    links: [
      { text: 'Dashboard', url: `${dashboardUrl}/login`, external: true, on: 'nav' },
      { text: 'Website', url: siteUrl, external: true, on: 'nav' },
      { text: 'Status', url: 'https://status.stackblaze.cloud', external: true, on: 'nav' },
    ],
  };
}
