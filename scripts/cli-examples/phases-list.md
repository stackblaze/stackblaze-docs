List a project's environments and the cluster each one runs on:

```sh
stackblaze phases list -p github-demo-cw8z
```

```text
┌─────────────┬─────────┬─────────────────────┐
│ Environment │ Enabled │ Context             │
├─────────────┼─────────┼─────────────────────┤
│ dev         │ yes     │ cloud-dev-central-1 │
├─────────────┼─────────┼─────────────────────┤
│ stage       │ yes     │ cloud-dev-central-1 │
├─────────────┼─────────┼─────────────────────┤
│ production  │ yes     │ cloud-dev-central-1 │
└─────────────┴─────────┴─────────────────────┘
```

Get just the names in a script:

```sh
stackblaze phases list -p github-demo-cw8z --json | jq -r '.[].name'
```

```text
dev
stage
production
```
