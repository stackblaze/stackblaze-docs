List the SSH keys on your account:

```sh
stackblaze ssh-keys list
```

```text
┌─────────────┬────────────────────────────────────────────────────┬───────────┬───────────────────────────┐
│ Name        │ Fingerprint                                        │ Last used │ ID                        │
├─────────────┼────────────────────────────────────────────────────┼───────────┼───────────────────────────┤
│ docs-laptop │ SHA256:5g5mDATXIDsUT/hhNWty4UwZHa24gLT8U4YyaENuOW0 │ never     │ cmww84bpo006duz01waozhn6z │
└─────────────┴────────────────────────────────────────────────────┴───────────┴───────────────────────────┘
```

With `--json`:

```sh
stackblaze ssh-keys list --json
```

```text
[
  {
    "id": "cmww84bpo006duz01waozhn6z",
    "name": "docs-laptop",
    "fingerprint": "SHA256:5g5mDATXIDsUT/hhNWty4UwZHa24gLT8U4YyaENuOW0",
    "createdAt": "2026-11-25T14:33:21.228Z",
    "lastUsedAt": null
  }
]
```
