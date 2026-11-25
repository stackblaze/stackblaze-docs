List an app's volumes and their snapshots. A snapshot can be cloned once it shows `ready=true`.

```sh
stackblaze snapshots list -p github-demo-cw8z -e stage -a vite-starter
```

```text
data  1Gi
  vite-starter-5tjx-data-1795619211011  group=snap-vite-starter-5tjx-1795619210271  ready=true
Restore = a NEW copy, never in place: `stackblaze snapshots clone <group> <new-app>`, or `stackblaze backups restore <id> [--volume <name>]` (recovery points)
```
