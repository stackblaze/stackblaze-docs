import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Archive,
  Bell,
  BookOpen,
  Bot,
  Box,
  Boxes,
  Braces,
  Building,
  CalendarClock,
  ChartLine,
  ClipboardList,
  Code,
  Container,
  Cpu,
  CreditCard,
  Database,
  DatabaseBackup,
  Download,
  Eye,
  FileCode,
  FileInput,
  FingerprintPattern,
  FolderKanban,
  FolderOpen,
  FolderUp,
  Gauge,
  GitBranch,
  GitPullRequest,
  Globe,
  Hammer,
  HardDrive,
  HeartPulse,
  Key,
  KeyRound,
  KeySquare,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  Link as LinkIcon,
  Lock,
  Mail,
  MemoryStick,
  MessageCircle,
  MousePointerClick,
  Network,
  Package,
  Play,
  Plug,
  Puzzle,
  Rocket,
  RotateCcw,
  Route,
  ScanSearch,
  ScrollText,
  Settings,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Split,
  SquareTerminal,
  Users,
  Variable,
  Waypoints,
  Webhook,
  Zap,
} from 'lucide-react';

/** Lucide icons the home page and the sidebar sections use, by name. */
const ICONS: Record<string, LucideIcon> = {
  Activity,
  Archive,
  Bell,
  BookOpen,
  Bot,
  Box,
  Boxes,
  Braces,
  Building,
  CalendarClock,
  ChartLine,
  ClipboardList,
  Code,
  Container,
  Cpu,
  CreditCard,
  Database,
  DatabaseBackup,
  Download,
  Eye,
  FileCode,
  FileInput,
  FingerprintPattern,
  FolderKanban,
  FolderOpen,
  FolderUp,
  Gauge,
  GitBranch,
  GitPullRequest,
  Globe,
  Hammer,
  HardDrive,
  HeartPulse,
  Key,
  KeyRound,
  KeySquare,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  Link: LinkIcon,
  Lock,
  Mail,
  MemoryStick,
  MessageCircle,
  MousePointerClick,
  Network,
  Package,
  Play,
  Plug,
  Puzzle,
  Rocket,
  RotateCcw,
  Route,
  ScanSearch,
  ScrollText,
  Settings,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Split,
  SquareTerminal,
  Users,
  Variable,
  Waypoints,
  Webhook,
  Zap,
};

/** Tints for the large feature cards, light and dark. */
const TINTS = {
  amber:
    'from-amber-100/80 to-amber-50/30 border-amber-200/70 dark:from-amber-500/15 dark:to-transparent dark:border-amber-500/25',
  indigo:
    'from-indigo-100/80 to-indigo-50/30 border-indigo-200/70 dark:from-indigo-500/15 dark:to-transparent dark:border-indigo-500/25',
  rose: 'from-rose-100/80 to-rose-50/30 border-rose-200/70 dark:from-rose-500/15 dark:to-transparent dark:border-rose-500/25',
  emerald:
    'from-emerald-100/80 to-emerald-50/30 border-emerald-200/70 dark:from-emerald-500/15 dark:to-transparent dark:border-emerald-500/25',
} as const;

const ICON_TEXT = {
  amber: 'text-amber-500/35',
  indigo: 'text-indigo-500/35',
  rose: 'text-rose-500/35',
  emerald: 'text-emerald-500/35',
} as const;

export function FeatureCards({ children }: { children: React.ReactNode }) {
  return <div className="not-prose my-6 grid gap-4 sm:grid-cols-2">{children}</div>;
}

/** A large tinted card with a big faded icon as its illustration. */
export function FeatureCard({
  title,
  description,
  href,
  icon,
  tint,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  tint: keyof typeof TINTS;
}) {
  const Icon = ICONS[icon] ?? Rocket;
  return (
    <Link
      href={href}
      className={`group relative flex min-h-44 flex-col overflow-hidden rounded-xl border bg-gradient-to-br p-5 transition-shadow hover:shadow-md ${TINTS[tint]}`}
    >
      <span className="relative z-10 text-base font-medium text-fd-foreground">{title}</span>
      <span className="relative z-10 mt-2 max-w-[65%] text-sm text-fd-muted-foreground">{description}</span>
      <Icon
        aria-hidden
        strokeWidth={1}
        className={`pointer-events-none absolute -bottom-6 -right-4 size-40 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105 ${ICON_TEXT[tint]}`}
      />
    </Link>
  );
}

export function SectionCards({ children }: { children: React.ReactNode }) {
  return <div className="not-prose my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

/** A section card: an icon in a soft square, the title and one line. */
export function SectionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  const Icon = ICONS[icon] ?? Rocket;
  return (
    <Link
      href={href}
      className="group flex gap-3 rounded-xl border bg-fd-card p-4 transition-colors hover:bg-fd-accent/60"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-fd-primary/10 text-fd-primary">
        <Icon className="size-4.5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-fd-foreground">{title}</span>
        <span className="mt-0.5 block text-sm text-fd-muted-foreground">{description}</span>
      </span>
    </Link>
  );
}
