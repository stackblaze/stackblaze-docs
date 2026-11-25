Restore only the database from the newest recovery point, as a new database. Nothing running changes:

```sh
stackblaze backups restore latest --database whiteboard-8stj-postgresql-6bt2 -p github-demo-cw8z -e dev
```

```text
OK Restore b55c0774-27d9-4e7f-b893-c73d874d7282 started for github-demo-cw8z/dev
Follow it with `stackblaze backups status -p github-demo-cw8z -e dev` (or pass --wait).
```
