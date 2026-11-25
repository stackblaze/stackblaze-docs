Stage two variables and a scale change without deploying, then see what's waiting. Staged values are never shown:

```sh
stackblaze variables set LOG_LEVEL=debug FEATURE_CHECKOUT=on --skip-deploy -p github-demo-cw8z -e dev -a shop-web-xivg
stackblaze scale web=2 --skip-deploy -p github-demo-cw8z -e dev -a shop-web-xivg
stackblaze pending list -p github-demo-cw8z -e dev -a shop-web-xivg
```

```text
OK Staged 2 change(s) for github-demo-cw8z/dev/shop-web-xivg: LOG_LEVEL, FEATURE_CHECKOUT
2 change(s) pending. Apply them as one release with `stackblaze pending apply` (or `stackblaze deploy --apply-pending`); drop them with `stackblaze pending discard`.
OK Staged 1 change(s) for github-demo-cw8z/dev/shop-web: scale:web
3 change(s) pending. Apply them as one release with `stackblaze pending apply` (or `stackblaze deploy --apply-pending`); drop them with `stackblaze pending discard`.
OK 3 staged change(s) for github-demo-cw8z/dev/shop-web-xivg
  set   LOG_LEVEL  by <email>
  set   FEATURE_CHECKOUT  by <email>
  scale web replicas=2  by <email>
Values of staged variables are never shown. Apply with `stackblaze pending apply`.
```

With `--json`:

```sh
stackblaze pending list -p github-demo-cw8z -e dev -a shop-web-xivg --json
```

```text
{
  "pipeline": "github-demo-cw8z",
  "phase": "dev",
  "app": "shop-web-xivg",
  "count": 3,
  "changes": [
    {
      "id": "cmww8b0i4003mwn01sr7dn8k1",
      "op": "env.set",
      "key": "LOG_LEVEL",
      "createdBy": "<email>",
      "createdAt": "2026-11-25T14:38:33.291Z"
    },
    {
      "id": "cmww8b0i4003nwn01oawsd8ch",
      "op": "env.set",
      "key": "FEATURE_CHECKOUT",
      "createdBy": "<email>",
      "createdAt": "2026-11-25T14:38:33.291Z"
    },
    {
      "id": "cmww8b1kp008juz018fyfg0jz",
      "op": "scale",
      "key": "web",
      "createdBy": "<email>",
      "createdAt": "2026-11-25T14:38:34.680Z",
      "value": {
        "replicas": 2
      }
    }
  ]
}
```
