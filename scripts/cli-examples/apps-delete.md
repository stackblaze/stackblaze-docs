Delete an app together with the PostgreSQL database only it uses. Without `-y` the CLI lists what will go and asks you to confirm; pass `--keep-data` to keep the database.

```sh
stackblaze apps delete hello-site -y -p github-demo-cw8z -e dev
```

```text
OK Deleted github-demo-cw8z/dev/hello-site
OK Deleted database hello-web-qw6y-postgresql-s32l (PostgreSQL) and its data
```
