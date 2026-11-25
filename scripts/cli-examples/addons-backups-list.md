The dumps of the app's database, newest first, and the jobs that made them:

```sh
stackblaze addons backups list -p github-demo-cw8z -e dev -a whiteboard
```

```text
OK whiteboard-8stj-postgresql-6bt2 (PostgreSQL) dumps
  NAME                                                       SIZE       TIME              RECOVERY POINT
  dump-whiteboard-8stj-postgresql-6bt2-1795617127898-435d2c  3.2 KB     2026-11-25T14:32:10.236Z—
  dump-whiteboard-8stj-postgresql-6bt2-1795617069871-8f0c9b  1.3 KB     2026-11-25T14:31:11.695Z—
Restore a dump as a NEW database (`<db>-restored`): `stackblaze addons backups restore <db> --backup <name>`.

Jobs:
  NAME                                                       TYPE     PHASE      STARTED                   FINISHED
  dump-whiteboard-8stj-postgresql-6bt2-1795617127898-435d2c  dump     Completed  2026-11-25T14:32:07.000Z  2026-11-25T14:32:13.000Z
  dump-whiteboard-8stj-postgresql-6bt2-1795617069871-8f0c9b  dump     Completed  2026-11-25T14:31:09.000Z  2026-11-25T14:31:14.000Z
```
