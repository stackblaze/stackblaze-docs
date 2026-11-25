Download a folder from the app's volume as a tar archive, then look inside it.

```sh
stackblaze files download /data/uploads/imports --out imports-backup.tar -p github-demo-cw8z -e dev -a hello-web
tar tvf imports-backup.tar
```

```text
OK Saved /data/uploads/imports → <current directory>/imports-backup.tar
Archive is tar format; extract with: tar xf imports-backup.tar
drwxr-xr-x nginx/nginx       0 2026-11-25 14:55 imports/
-rw-r--r-- nginx/nginx      22 2026-11-25 14:55 imports/customers-2026-11.csv
```
