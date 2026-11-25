Dump the app's database now, without a schedule, and wait for it:

```sh
stackblaze addons backups create -p github-demo-cw8z -e dev -a whiteboard --wait
```

```text
Dump dump-whiteboard-8stj-postgresql-6bt2-1795617127898-435d2c started — waiting for it to finish…
dump dump-whiteboard-8stj-postgresql-6bt2-1795617127898-435d2c → Running
dump dump-whiteboard-8stj-postgresql-6bt2-1795617127898-435d2c → Completed
OK Backup dump-whiteboard-8stj-postgresql-6bt2-1795617127898-435d2c completed
```
