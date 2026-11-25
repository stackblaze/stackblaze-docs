'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type * as PageTree from 'fumadocs-core/page-tree';
import { useTreePath } from 'fumadocs-ui/contexts/tree';
import {
  SidebarFolder,
  SidebarFolderContent,
  SidebarFolderLink,
  SidebarFolderTrigger,
  useFolderDepth,
} from 'fumadocs-ui/components/sidebar/base';

// Sidebar folders as an accordion: opening a top-level section closes the others.
// Fumadocs keeps each folder's open state inside the folder, so a section that should
// close is remounted (its key changes) and starts closed. Styles copy the notebook layout's.

let openTop: string | null = null;
const listeners = new Set<(id: string | null) => void>();
function setOpenTop(id: string | null) {
  if (id === openTop) return;
  openTop = id;
  listeners.forEach((l) => l(id));
}
function useOpenTop() {
  const [id, setId] = useState(openTop);
  useEffect(() => {
    listeners.add(setId);
    return () => void listeners.delete(setId);
  }, []);
  return id;
}

const item =
  'relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground wrap-anywhere [&_svg]:size-4 [&_svg]:shrink-0 w-full transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 hover:transition-none';
const link = 'data-[active=true]:bg-fd-primary/10 data-[active=true]:text-fd-primary data-[active=true]:hover:transition-colors';
const highlight =
  "data-[active=true]:before:content-[''] data-[active=true]:before:bg-fd-primary data-[active=true]:before:absolute data-[active=true]:before:w-px data-[active=true]:before:inset-y-2.5 data-[active=true]:before:start-2.5";
const offset = (depth: number) => `calc(${2 + 3 * depth} * var(--spacing))`;
const normalize = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);

export function SidebarAccordionFolder({ item: node, children }: { item: PageTree.Folder; children: ReactNode }) {
  const depth = useFolderDepth(); // 0 for a top-level section
  const path = useTreePath();
  const pathname = usePathname();
  const open = useOpenTop();
  const id = node.$id ?? String(node.name);
  const activeTop = path[0]?.type === 'folder' ? (path[0].$id ?? String(path[0].name)) : null;

  // Navigating (sidebar, links in a page, search) opens the section of the new page and closes the rest.
  useEffect(() => {
    if (depth === 0 && activeTop === id) setOpenTop(id);
  }, [depth, activeTop, id]);

  const top = depth === 0;
  const active = path.includes(node);
  const isOpen = top ? open === id || (open === null && active) : undefined;
  const indexActive = !!node.index && normalize(node.index.url) === normalize(pathname);

  return (
    <div onClickCapture={top ? () => setOpenTop(id) : undefined}>
      <SidebarFolder
        key={top ? (isOpen ? 'open' : `closed:${open}`) : undefined}
        collapsible={node.collapsible}
        active={top ? isOpen : active}
        defaultOpen={top ? isOpen : node.defaultOpen}
      >
        {node.index ? (
          <SidebarFolderLink
            href={node.index.url}
            active={indexActive}
            external={node.index.external}
            className={`${item} ${link} ${depth + 1 > 1 ? highlight : ''}`}
            style={{ paddingInlineStart: offset(depth) }}
          >
            {node.icon}
            {node.name}
          </SidebarFolderLink>
        ) : (
          <SidebarFolderTrigger className={item} style={{ paddingInlineStart: offset(depth) }}>
            {node.icon}
            {node.name}
          </SidebarFolderTrigger>
        )}
        <SidebarFolderContent
          className={`relative flex flex-col gap-0.5 pt-0.5 ${depth + 1 === 1 ? "before:content-[''] before:absolute before:w-px before:inset-y-1 before:bg-fd-border before:start-2.5" : ''}`}
        >
          {children}
        </SidebarFolderContent>
      </SidebarFolder>
    </div>
  );
}
