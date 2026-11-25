Pause a notification without deleting it:

```sh
stackblaze notifications disable docs-deploys
```

```text
OK Disabled notification docs-deploys
```

Running it again changes nothing. `--json` says so with `"changed": false`:

```sh
stackblaze notifications disable docs-deploys --json
```

```text
{
  "id": "cmww853ip006guz014j6zggnz",
  "name": "docs-deploys",
  "type": "webhook",
  "enabled": false,
  "pipelines": [
    "github-demo-cw8z"
  ],
  "events": [
    "deployApp",
    "deleteApp"
  ],
  "config": {
    "url": "********",
    "secret": "********"
  },
  "changed": false
}
```
