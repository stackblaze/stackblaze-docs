List the app's log drains:

```sh
stackblaze log-drains list -p github-demo-cw8z -e dev -a shop-web-xivg
```

```text
OK github-demo-cw8z/dev/shop-web-xivg log drains
┌────────┬─────────┬──────┬────────────────────────────┬───────────────┐
│ Name   │ Sources │ Sink │ Endpoint                   │ Filter        │
├────────┼─────────┼──────┼────────────────────────────┼───────────────┤
│ errors │ web     │ http │ https://example.com/ingest │ level ≥ error │
└────────┴─────────┴──────┴────────────────────────────┴───────────────┘
```

With `--json`, as saved on the app:

```sh
stackblaze log-drains list -p github-demo-cw8z -e dev -a shop-web-xivg --json
```

```text
{
  "pipeline": "github-demo-cw8z",
  "phase": "dev",
  "app": "shop-web-xivg",
  "logDrains": [
    {
      "filter": {
        "minLevel": "error"
      },
      "name": "errors",
      "select": {
        "sources": [
          "web"
        ]
      },
      "sink": {
        "endpoint": "https://example.com/ingest",
        "type": "http"
      }
    }
  ]
}
```
