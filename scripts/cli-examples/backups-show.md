What a recovery point holds, and what restoring it would create:

```sh
stackblaze backups show manual-github-demo-cw8z-dev-1795617417246 -p github-demo-cw8z -e dev
```

```text
OK github-demo-cw8z/dev recovery point manual-github-demo-cw8z-dev-1795617417246  Completed
time      2026-11-25T14:37:00Z
trigger   manual
contents  partial: whiteboard-8stj-postgresql-6bt2
expires   2026-12-02T14:36:58Z

Databases:
  whiteboard-8stj-postgresql-6bt2
Volumes:
  none

Restore: as NEW databases and volumes — everything in the point, or only chosen items (--database / --volume); nothing running is touched. See `stackblaze backups restore --help`.
```
