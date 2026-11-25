Ship only the web process's error lines to your own HTTP collector. The endpoint has to be a public address:

```sh
stackblaze log-drains add errors --type http --endpoint https://example.com/ingest \
  --source web --min-level error -p github-demo-cw8z -e dev -a shop-web-xivg
```

```text
OK Added log drain errors to github-demo-cw8z/dev/shop-web-xivg
web → http https://example.com/ingest  (level ≥ error)
The app rolls out with the new drain; logs start shipping once the new pods are up.
```

A host that doesn't resolve is refused:

```sh
stackblaze log-drains add errors --type http --endpoint https://logs.example.com/ingest \
  --source web --min-level error -p github-demo-cw8z -e dev -a shop-web-xivg
```

```text
x  logDrains[0].sink.endpoint must be a public destination (host logs.example.com does not resolve)
```
