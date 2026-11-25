Create a scheduled task that runs every night at 02:00 UTC in the app's image. Use `sh -c '…'` when the command needs a shell.

```sh
stackblaze cron set nightly-report --schedule "0 2 * * *" \
  --command "sh -c 'echo report for \$(date -u +%F); nginx -v'" \
  -p github-demo-cw8z -e dev -a hello-web
```

```text
OK Created nightly-report: 0 2 * * *  sh -c 'echo report for $(date -u +%F); nginx -v'
```

Run it again with only `--schedule` or only `--command` to change just that.
