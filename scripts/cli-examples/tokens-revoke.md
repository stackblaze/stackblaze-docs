Revoke a token you no longer use, by its ID from `stackblaze tokens list` (a name works too when it's unique). The CLI asks first:

```sh
stackblaze tokens revoke cmww81ta7005huz01djfqp8kx
```

```text
Revoke token "CLI · 2026-11-25" (cmww81ta7005huz01djfqp8kx)? Anything using it stops working [y/N]: y
OK Revoked token CLI · 2026-11-25
```

A machine still signed in with that token is refused from then on:

```sh
stackblaze whoami
```

```text
x  Unauthorized
```
