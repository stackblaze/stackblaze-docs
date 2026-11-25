Connect the `whiteboard` app to a second database that already runs in the environment (here, one restored from a dump). Its variables get the database's name as a prefix, so they don't clash with the app's own `DATABASE_URL`:

```sh
stackblaze addons share whiteboard-8stj-postgresql-restored-76yo -p github-demo-cw8z -e dev --with whiteboard --wait
```

```text
OK Shared whiteboard-8stj-postgresql-restored-76yo with github-demo-cw8z/dev/whiteboard
Waiting for github-demo-cw8z/dev/whiteboard-8stj to be ready (up to 10m00s)…
  github-demo-cw8z/dev/whiteboard-8stj: deploying — Rolling out new version; rolling out (Updated env vars (NOTES_COPY_DATABASE_URL, NOTES_COPY_PGDATABASE, NOTES_COPY_PGHOST, +5), shared add-ons): waiting for the new pod (2s elapsed)
…
  github-demo-cw8z/dev/whiteboard-8stj: deploying — Rolling out new version (1m38s elapsed)
OK github-demo-cw8z/dev/whiteboard-8stj is ready
url: https://whiteboard-8stj.cloud-dev-central-1.stackblaze.app
```
