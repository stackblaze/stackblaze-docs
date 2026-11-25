Restore the newest dump as a new database next to the running one. The app keeps using its database until you connect it to the new one (`addons share`):

```sh
stackblaze addons backups restore whiteboard-8stj-postgresql-6bt2 -p github-demo-cw8z -e dev -a whiteboard
```

```text
OK New PostgreSQL database whiteboard-8stj-postgresql-restored-2 (whiteboard-8stj-postgresql-restored-76yo) is being restored from dump-whiteboard-8stj-postgresql-6bt2-1795617127898-435d2c of whiteboard-8stj-postgresql-6bt2 (job restore-whiteboard-8stj-postgresql-restore-1795617222737-bdd6b9)
Follow it with `stackblaze backups status -p github-demo-cw8z -e dev` (or pass --wait).
```
