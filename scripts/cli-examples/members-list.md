List the organization's members with their role and teams:

```sh
stackblaze members list
```

```text
┌────────────────────────┬────────────────────────┬───────┬──────────────────────────────────┬───────────────────────────┐
│ User                   │ Email                  │ Role  │ Teams                            │ ID                        │
├────────────────────────┼────────────────────────┼───────┼──────────────────────────────────┼───────────────────────────┤
│ <email>                │ <email>                │ admin │ admin (admin), all users (admin) │ cmtxmgub2002cvq014h3z0qeh │
└────────────────────────┴────────────────────────┴───────┴──────────────────────────────────┴───────────────────────────┘
```

With `--json`:

```sh
stackblaze members list --json
```

```text
[
  {
    "userId": "cmtxmgub2002cvq014h3z0qeh",
    "username": "<email>",
    "email": "<email>",
    "name": null,
    "role": "admin",
    "teams": [
      {
        "team": "admin",
        "role": "admin"
      },
      {
        "team": "all users",
        "role": "admin"
      }
    ]
  }
]
```
