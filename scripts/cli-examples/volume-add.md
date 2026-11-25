Attach a 1 GiB persistent volume to an app at `/data/uploads`. The app rolls out with it.

```sh
stackblaze volume add uploads --mount /data/uploads --size 1Gi -p github-demo-cw8z -e dev -a hello-web
```

```text
OK Added volume uploads at /data/uploads on github-demo-cw8z/dev/hello-web-qw6y
```
