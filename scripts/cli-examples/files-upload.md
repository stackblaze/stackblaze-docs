Upload a local file into a folder on the app's volume. A trailing `/` on `--path` means "into this folder"; it is created if needed.

```sh
stackblaze files upload customers.csv --path /data/uploads/imports/ -p github-demo-cw8z -e dev -a hello-web
```

```text
OK Uploaded → /data/uploads/imports/customers.csv
pod=hello-web-qw6y-web-59ffbdcb4-xckfx
```
