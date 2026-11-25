Open `psql` on your machine against the app's PostgreSQL add-on, through a private tunnel (the app's image has no `psql`, so the default in-pod mode can't be used). Here it creates a table, adds a row and reads it back.

```sh
PAGER=cat PSQL_PAGER=cat stackblaze connect postgres --local -p github-demo-cw8z -e dev -a hello-web
```

```text
Tunnel 127.0.0.1:41963 → postgres addon "hello-web-qw6y-postgresql-s32l". Running local psql…
psql (14.24 (Ubuntu 14.24-0ubuntu0.22.04.1), server 17.5 (Debian 17.5-1.pgdg110+1))
WARNING: psql major version 14, server major version 17.
         Some psql features might not work.
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
Type "help" for help.

app=# create table if not exists signups (email text, created date default current_date);
CREATE TABLE
app=# insert into signups values ('ada@example.com');
INSERT 0 1
app=# select * from signups;
      email      |  created   
-----------------+------------
 ada@example.com | 2026-11-25
(1 row)

app=# \q
```

Without `--local`, `psql` runs inside the app's pod, and the CLI says so when the image doesn't have it:

```sh
stackblaze connect postgres -p github-demo-cw8z -e dev -a hello-web
```

```text
Connecting to postgres addon "hello-web-qw6y-postgresql-s32l" via hello-web-qw6y-web-59c674b9c6-f8jsk/web…
sh: exec: line 0: psql: not found
x  The postgres client is not installed in the app's image. Run it on this machine instead: stackblaze connect postgres --local (or --tunnel for GUI tools).
```
