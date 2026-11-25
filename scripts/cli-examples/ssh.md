Run one command in the app's web pod and exit with its exit code. Leave out `--command` for an interactive shell.

```sh
stackblaze ssh -p github-demo-cw8z -e dev -a hello-web \
  --command 'nginx -v 2>&1; df -h /data/uploads | tail -1; ls --color=never /data/uploads/imports'
```

```text
nginx version: nginx/1.27.3
JuiceFS:juicefs           1.0G      8.0K   1024.0M   0% /data/uploads
customers-2026-11.csv
```
