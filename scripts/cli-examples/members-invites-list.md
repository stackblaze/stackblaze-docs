List pending invitations. Here there are none, so `--all` also shows the accepted and revoked ones:

```sh
stackblaze members invites list
stackblaze members invites list --all
```

```text
No pending invitations (--all shows accepted/revoked ones too).
┌───────────────────────────┬────────────────────────┬────────┬─────────┬────────────┐
│ ID                        │ Email                  │ Role   │ Status  │ Expires    │
├───────────────────────────┼────────────────────────┼────────┼─────────┼────────────┤
│ cmwuv73he005ut301eyy7c06u │ <email>                │ member │ revoked │ 2026-12-01 │
└───────────────────────────┴────────────────────────┴────────┴─────────┴────────────┘
```
