Show the organization's saved registry login (`stackblaze registry` on its own does the same). The password is never shown:

```sh
stackblaze registry status
```

```text
registry.example.com  user docs-demo  password set
```

With `--json`; `login` is `null` when there is none:

```sh
stackblaze registry status --json
```

```text
{
  "login": {
    "host": "registry.example.com",
    "username": "docs-demo",
    "passwordSet": true
  }
}
```
