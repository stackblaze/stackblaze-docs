# AGENTS.md — stackblaze-docs

The StackBlaze product docs: a [Fumadocs](https://fumadocs.dev) site on Next.js 16, served at
www.stackblaze.com/docs. The app runs under `basePath: '/docs'`; the website on Vercel forwards
`/docs/*` to it. It runs on the `leaseweb-montreal` cluster (`deploy/docs.yaml` from `main`,
`deploy/docs-dev.yaml` from `dev`).

## The one rule: nothing made up

- Every guide is written by **doing it** in the real dashboard. Every step on a page must be a
  step the capture flow for that page performs (`scripts/capture/flows/<page>.mjs`).
- Screenshots come only from the capture script. `<Screenshot id="…">` reads
  `lib/screenshots.json`, which only `scripts/capture/lib.mjs` writes; an id that was never
  captured fails the build. Never hand-edit the manifest or drop in an image from elsewhere.
- Light mode only.
- Limits, labels, defaults and prices are checked against the dashboard / kubero-server code on
  `main`. If something can't be performed or verified, it does not go on the page.
- Features not enabled on production are not documented as available.

## Capture

```sh
# Chrome with remote debugging on 127.0.0.1:9222, signed in to dashboard-dev with the docs test account
CAPTURE_MASK=<account email> node scripts/capture/flows/quickstart.mjs
```

`CAPTURE_MASK` (comma-separated) replaces those strings in the UI before each shot. Never commit
an account email or any secret.

## Build / run

```sh
npm ci
npm run dev          # http://localhost:3000/docs
npm run build && npm run types:check
```

## Ship

PR into `dev` → image `:dev` → `docs-dev` namespace. `main` → `:main` → `docs`. After the image
workflow finishes: `kubectl --context leaseweb-montreal -n <ns> rollout restart deploy/docs`.

## Fumadocs references

- Writing pages: https://fumadocs.dev/docs/next/markdown.md
- Page conventions: https://fumadocs.dev/docs/next/page-conventions.md
- Customizing the UI: https://fumadocs.dev/docs/next/guides/customize-ui.md
- Theme: https://fumadocs.dev/docs/ui/theme.md
- Everything: https://fumadocs.dev/llms.txt
