Rename a file on the app's volume, then list the folder.

```sh
stackblaze files rename --from /data/uploads/imports/customers.csv --to /data/uploads/imports/customers-2026-11.csv -p github-demo-cw8z -e dev -a hello-web
stackblaze files list /data/uploads/imports -p github-demo-cw8z -e dev -a hello-web
```

```text
OK Renamed /data/uploads/imports/customers.csv → /data/uploads/imports/customers-2026-11.csv
/data/uploads/imports  pod=hello-web-qw6y-web-59ffbdcb4-xckfx
f  customers-2026-11.csv 22B
```
