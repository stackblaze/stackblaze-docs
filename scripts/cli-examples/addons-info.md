How to connect to the app's PostgreSQL. Passwords and connection strings stay hidden until you pass `--reveal`:

```sh
stackblaze addons info whiteboard-8stj-postgresql-6bt2 -p github-demo-cw8z -e dev -a whiteboard
```

```text
OK whiteboard-8stj-postgresql-6bt2 (PostgreSQL)
  engine:      postgres
  host:        whiteboard-8stj-postgresql-6bt2-rw.github-demo-cw8z-dev.svc.cluster.local
  port:        5432
  database:    app
  user:        postgres
  password:    ********
  uri:         ********
  public:      db.edge.stackblaze.cloud:15000
  allowed:     203.0.113.10
  Credentials hidden; pass --reveal to show them.
```

The JSON also has the JDBC URL and the public access settings:

```sh
stackblaze addons info whiteboard-8stj-postgresql-6bt2 -p github-demo-cw8z -e dev -a whiteboard --json
```

```text
{
  "addon": "whiteboard-8stj-postgresql-6bt2",
  "kind": "Cluster",
  "engine": "postgres",
  "host": "whiteboard-8stj-postgresql-6bt2-rw.github-demo-cw8z-dev.svc.cluster.local",
  "port": 5432,
  "username": "postgres",
  "password": "********",
  "database": "app",
  "system": "PostgreSQL",
  "server": "whiteboard-8stj-postgresql-6bt2-rw",
  "uri": "********",
  "jdbcUrl": "jdbc:postgresql://whiteboard-8stj-postgresql-6bt2-rw.github-demo-cw8z-dev.svc.cluster.local:5432/app",
  "envSnippet": "********",
  …
  "publicExposed": true,
  "publicExposable": true,
  "publicAddress": "db.edge.stackblaze.cloud:15000",
  "publicAllowList": [
    "203.0.113.10"
  ],
  "publicAllowAll": false,
  "publicTls": false
}
```
