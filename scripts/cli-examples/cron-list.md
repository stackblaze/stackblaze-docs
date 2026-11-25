List an app's scheduled tasks with their schedule, last run and command.

```sh
stackblaze cron list -p github-demo-gv35 -e dev -a nginx
```

```text
OK github-demo-gv35/dev/nginx-9agm scheduled tasks
  NAME   SCHEDULE      LAST RUN              COMMAND
  hello  */30 * * * *  succeeded             /bin/sh -c 'echo hello from nginx; nginx -v'  (managed by scheduled-tasks-31d7)
```
