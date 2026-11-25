List the organizations you belong to. `*` marks the one this login acts in:

```sh
stackblaze orgs list
```

```text
┌─────┬───────────────────┬───────────────────┬──────────┬────────┐
│     │ Slug              │ Name              │ Plan     │ Status │
├─────┼───────────────────┼───────────────────┼──────────┼────────┤
│ *   │ mellow-river-uw3w │ mellow-river-uw3w │ Business │ active │
└─────┴───────────────────┴───────────────────┴──────────┴────────┘
```

With `--json`, `current` marks it and `id` is what `--org` and the API take:

```sh
stackblaze orgs list --json
```

```text
[
  {
    "id": "cmw5858w5002xvk010f9zs5w8",
    "slug": "mellow-river-uw3w",
    "name": "mellow-river-uw3w",
    "status": "active",
    "plan": "Business",
    "current": true
  }
]
```
