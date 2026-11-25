Load a plain SQL dump (made with `pg_dump --no-owner --no-acl`) from this machine into an empty PostgreSQL add-on. The CLI uploads the file, the cluster loads it, and `--wait` prints the result:

```sh
stackblaze addons import notes.sql --addon whiteboard-8stj-postgresql-6bt2 -p github-demo-cw8z -e dev --wait
```

```text
!  This loads notes.sql into PostgreSQL add-on "whiteboard-8stj-postgresql-6bt2" of github-demo-cw8z/dev on https://api-dev.stackblaze.cloud, inside the cluster. It writes into the existing database: use an empty one.
Type "yes" to continue: 
Uploading notes.sql (plain SQL, 2.0 KB)…
Uploading: 100% (2.0 KB/2.0 KB)
Import import-whiteboard-8stj-postgresql-6bt2-1795617111618-6e1dbb started in the cluster (uploaded file).
  pending … 0s
  restore: loading it into the database … 6s
OK Imported 1 table, 3 rows (2.0 KB, plain SQL) — "whiteboard-8stj-postgresql-6bt2" (import-whiteboard-8stj-postgresql-6bt2-1795617111618-6e1dbb).
```
