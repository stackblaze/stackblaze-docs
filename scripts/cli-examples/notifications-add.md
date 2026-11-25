Send a signed webhook to your own endpoint when an app in `github-demo-cw8z` is deployed or deleted. `--disabled` creates it switched off, so you can turn it on once the endpoint is ready:

```sh
stackblaze notifications add docs-deploys --type webhook \
  --url https://example.com/hooks/stackblaze --secret "$HOOK_SECRET" \
  --event deployApp --event deleteApp --projects github-demo-cw8z --disabled
```

```text
OK Added webhook notification docs-deploys (disabled)
projects: github-demo-cw8z  events: deployApp, deleteApp
id: cmww853ip006guz014j6zggnz
```
