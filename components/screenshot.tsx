import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import manifest from '@/lib/screenshots.json';
import { basePath } from '@/lib/shared';

type Shot = { src: string; width: number; height: number; capturedAt: string };
const shots = manifest as Record<string, Shot>;

/**
 * A dashboard screenshot (light mode), click to zoom.
 *
 * `id` must exist in lib/screenshots.json, which only the capture script
 * (scripts/capture) writes: a screenshot that was never captured from the
 * real dashboard fails the build instead of shipping a placeholder.
 */
export function Screenshot({ id, alt }: { id: string; alt: string }) {
  const shot = shots[id];
  if (!shot) throw new Error(`Screenshot "${id}" is not in lib/screenshots.json; run the capture script.`);
  const common = { alt, width: shot.width, height: shot.height } as const;
  return (
    <figure className="my-6 mx-auto" style={{ maxWidth: shot.width }}>
      <div className="overflow-hidden rounded-xl border bg-fd-card shadow-sm">
        <ImageZoom {...common} src={`${basePath}${shot.src}`} className="m-0!" />
      </div>
      <figcaption className="mt-2 text-center text-sm text-fd-muted-foreground">{alt}</figcaption>
    </figure>
  );
}
