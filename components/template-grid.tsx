// App templates from the live production catalog (the same source as
// www.stackblaze.com/templates), linking to each template's page there.
import { siteUrl } from '@/lib/shared';

const CATALOG = 'https://api.stackblaze.cloud/api/templates/catalog';

type Service = { name: string; dirname: string; description?: string; icon?: string; status?: string };

// Catalog blurbs sometimes compare the app with named products; the docs
// don't name other companies, so those sentences are left out here.
function blurb(d = '') {
  return d
    .split(/(?<=\.)\s+/)
    .filter((s) => !/\balternative (to|for)\b/i.test(s))
    .join(' ');
}

async function templates(): Promise<Service[]> {
  try {
    const res = await fetch(CATALOG, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { catalogs: { services?: Service[] }[] };
    return data.catalogs.flatMap((c) => c.services ?? []).filter((s) => s.dirname && s.status !== 'inactive');
  } catch {
    return [];
  }
}

export async function TemplateGrid({ limit }: { limit?: number }) {
  const all = await templates();
  const shown = limit ? all.slice(0, limit) : all;
  if (!shown.length) {
    return (
      <p>
        <a href={`${siteUrl}/templates`}>Browse all templates</a>
      </p>
    );
  }
  return (
    <div className="not-prose my-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => (
          <a
            key={t.dirname}
            href={`${siteUrl}/templates/${t.dirname}`}
            className="flex items-start gap-3 rounded-lg border bg-fd-card p-3 transition-colors hover:bg-fd-accent"
          >
            {t.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.icon} alt="" width={32} height={32} className="size-8 shrink-0 rounded object-contain" loading="lazy" />
            ) : (
              <span className="size-8 shrink-0 rounded bg-fd-muted" />
            )}
            <span className="min-w-0">
              <span className="block text-sm font-medium text-fd-foreground">{t.name}</span>
              {blurb(t.description) ? (
                <span className="mt-0.5 line-clamp-2 block text-xs text-fd-muted-foreground">{blurb(t.description)}</span>
              ) : null}
            </span>
          </a>
        ))}
      </div>
      <p className="mt-4 text-sm">
        <a href={`${siteUrl}/templates`} className="font-medium text-fd-primary">
          View all {all.length} templates →
        </a>
      </p>
    </div>
  );
}
