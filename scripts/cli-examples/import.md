Preview what a `docker-compose.yml` with a web server and a Redis cache would create. `--dry-run` creates nothing; the warnings say what the importer changes:

```yaml
services:
  web:
    image: nginxinc/nginx-unprivileged:1.27-alpine
    ports:
      - "8080:8080"
    environment:
      REDIS_URL: redis://cache:6379
    depends_on:
      - cache
  cache:
    image: redis:7-alpine
```

```sh
stackblaze import docker-compose.yml -p github-demo-cw8z -e dev --dry-run
```

```text
OK docker-compose.yml (docker-compose) → github-demo-cw8z/dev: 1 service, 1 database would be created
┌──────────┬──────────────────────┬─────────┐
│ Resource │ Kind                 │ Plan    │
├──────────┼──────────────────────┼─────────┤
│ cache    │ database (Valkey)    │ planned │
├──────────┼──────────────────────┼─────────┤
│ web      │ app (docker · plain) │ planned │
└──────────┴──────────────────────┴─────────┘
!  docker-compose.yml: "web" REDIS_URL was repointed at the cache add-on (compose service DNS does not carry over)
!  docker-compose.yml: "web" depends_on is ignored — services start independently and retry
--dry-run: nothing was created. Run again without it to import.
```
