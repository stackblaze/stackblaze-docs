Take a partial recovery point of just the `whiteboard` app and its database, and wait until the dump is saved:

```sh
stackblaze backups create -p github-demo-cw8z -e dev --only whiteboard,whiteboard-8stj-postgresql-6bt2 --wait
```

```text
Backup manual-github-demo-cw8z-dev-1795617417246 started — waiting for it to finish…
backup manual-github-demo-cw8z-dev-1795617417246 → InProgress
backup manual-github-demo-cw8z-dev-1795617417246 → saving databases
backup manual-github-demo-cw8z-dev-1795617417246 → Completed
OK Backup manual-github-demo-cw8z-dev-1795617417246 completed (partial: whiteboard-8stj-postgresql-6bt2)
```

The app has no volumes, so the point holds only the database.
