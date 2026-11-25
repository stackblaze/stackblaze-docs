Show the on-demand spending setting without changing it (pass an amount, `unlimited` or `off` to change it):

```sh
stackblaze billing limit
```

```text
On-demand spending: on, no monthly limit
Change it: stackblaze billing limit <usd per month> | unlimited | off
```

With `--json`, `monthlyLimitCents` is `null` when there is no cap:

```sh
stackblaze billing limit --json
```

```text
{
  "enabled": true,
  "monthlyLimitCents": null,
  "monthlyLimit": null,
  "billable": true
}
```
