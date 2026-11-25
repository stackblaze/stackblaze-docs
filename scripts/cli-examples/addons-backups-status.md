Check whether the environment's scheduled backups cover the app's database:

```sh
stackblaze addons backups status -p github-demo-cw8z -e dev -a whiteboard
```

```text
OK whiteboard-8stj-postgresql-6bt2 (PostgreSQL) scheduled backups: off
  Turn scheduled backups on in the dashboard (environment → Backups). The CLI never creates a schedule.
  last dump:  -
  dumps kept: 0
  `stackblaze backups create --only whiteboard-8stj-postgresql-6bt2` takes a recovery point of it now (no schedule needed).
```
