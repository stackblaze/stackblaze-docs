List the volumes attached to an app.

```sh
stackblaze volume list -p github-demo-cw8z -e dev -a hello-web
```

```text
┌─────────┬───────────────┬──────┬────────┐
│ Name    │ Mount         │ Size │ Class  │
├─────────┼───────────────┼──────┼────────┤
│ uploads │ /data/uploads │ 1Gi  │ shared │
└─────────┴───────────────┴──────┴────────┘
```
