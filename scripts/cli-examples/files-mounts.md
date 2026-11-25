List the paths in the app's pod where you can read and write files: its volumes, plus `/tmp`.

```sh
stackblaze files mounts -p github-demo-cw8z -e dev -a hello-web
```

```text
pod=hello-web-qw6y-web-59ffbdcb4-xckfx  container=web
/data/uploads  pvc=uploads  1Gi
  access: ReadWriteMany
/tmp
```
