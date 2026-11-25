Let one address connect to the app's PostgreSQL from outside the platform:

```sh
stackblaze addons expose whiteboard-8stj-postgresql-6bt2 -p github-demo-cw8z -e dev -a whiteboard --allow 203.0.113.10
```

```text
OK whiteboard-8stj-postgresql-6bt2 is public at db.edge.stackblaze.cloud:15000
  allowed: 203.0.113.10
  credentials: `stackblaze addons info whiteboard-8stj-postgresql-6bt2 --reveal`
```
