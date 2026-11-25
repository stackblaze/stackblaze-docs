Run a scheduled task now, outside its schedule, and wait for it to finish. With `--wait` the command exits with 1 if the run fails.

```sh
stackblaze cron run nightly-report --wait -p github-demo-cw8z -e dev -a hello-web
```

```text
nightly-report was just saved and is still rolling out — retrying…
Started nightly-report (run hello-web-qw6y-nightly-report-mmww8ro2s) — waiting for it to finish…
run hello-web-qw6y-nightly-report-mmww8ro2s → running
run hello-web-qw6y-nightly-report-mmww8ro2s → succeeded
OK nightly-report succeeded (run hello-web-qw6y-nightly-report-mmww8ro2s)
```
