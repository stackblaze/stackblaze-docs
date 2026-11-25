import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { SidebarAccordionFolder } from '@/components/sidebar-folder';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <DocsLayout tree={source.getPageTree()} {...baseOptions()} sidebar={{ components: { Folder: SidebarAccordionFolder } }}>
      {children}
    </DocsLayout>
  );
}
