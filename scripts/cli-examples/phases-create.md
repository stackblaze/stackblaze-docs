Add an empty `qa` environment to a project:

```sh
stackblaze phases create qa -p github-demo-cw8z
stackblaze phases list -p github-demo-cw8z
```

```text
OK Created environment qa in project github-demo-cw8z
context: cloud-dev-central-1
┌─────────────┬─────────┬─────────────────────┐
│ Environment │ Enabled │ Context             │
├─────────────┼─────────┼─────────────────────┤
│ dev         │ yes     │ cloud-dev-central-1 │
├─────────────┼─────────┼─────────────────────┤
│ stage       │ yes     │ cloud-dev-central-1 │
├─────────────┼─────────┼─────────────────────┤
│ production  │ yes     │ cloud-dev-central-1 │
├─────────────┼─────────┼─────────────────────┤
│ qa          │ yes     │ cloud-dev-central-1 │
└─────────────┴─────────┴─────────────────────┘
```

`--from staging` would instead copy an existing environment's settings and every app in it (with empty data and new URLs).
