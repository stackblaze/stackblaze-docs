Show the output of a scheduled task's runs. Add `-f` to follow a run live, or `--job <run>` for one run.

```sh
stackblaze cron logs nightly-report -p github-demo-cw8z -e dev -a hello-web
```

```text
2026-11-25T14:51:31.415Z report for 2026-11-25
2026-11-25T14:51:31.417Z nginx version: nginx/1.27.3
```
