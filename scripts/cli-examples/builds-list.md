List a git app's builds, newest first, with their state and the image tag each one produced.

```sh
stackblaze builds list -p github-demo-cw8z -e stage -a vite-starter
```

```text
vite-starter-5tjx-github-demo-cw-20261125-150350-e709  Succeeded  tag=main-20261125-150350-e709  2026-11-25T15:03:51.000Z
vite-starter-5tjx-github-demo-cw-20261125-150148-59ba  Succeeded  tag=main-1795618908110-20261125-150148-59ba  2026-11-25T15:01:49.000Z
```
