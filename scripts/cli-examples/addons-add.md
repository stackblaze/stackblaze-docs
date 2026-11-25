Give the `whiteboard` app a PostgreSQL database and wait until both are running. The app gets `DATABASE_URL`, `PGHOST` and the other connection variables:

```sh
stackblaze addons add postgres -p github-demo-cw8z -e dev -a whiteboard --wait
```

```text
OK Added PostgreSQL (CloudNativePG) (whiteboard-8stj-postgresql) to github-demo-cw8z/dev/whiteboard-8stj
Waiting for github-demo-cw8z/dev/whiteboard-8stj to be ready (up to 10m00s)…
  github-demo-cw8z/dev/whiteboard-8stj: deploying — Addon whiteboard-8stj-postgresql-6bt2: Setting up primary; addon whiteboard-8stj-postgresql-6bt2 deploying; rolling out (Updated env vars (DATABASE_URL, PGDATABASE, PGHOST, +5), shared add-ons): waiting for the new pod (1s elapsed)
…
  github-demo-cw8z/dev/whiteboard-8stj: deploying — Addon whiteboard-8stj-postgresql-6bt2: Cluster Is Not Ready; addon whiteboard-8stj-postgresql-6bt2 deploying (1m02s elapsed)
OK github-demo-cw8z/dev/whiteboard-8stj is ready
url: https://whiteboard-8stj.cloud-dev-central-1.stackblaze.app
```
