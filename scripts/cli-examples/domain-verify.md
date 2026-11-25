Check a domain's DNS now. Until both records are found it stays pending, and the command exits with 1; add `--wait` to keep checking until HTTPS is ready.

```sh
stackblaze domain verify shop.example.com -p github-demo-cw8z -e dev -a hello-web
```

```text
shop.example.com  waiting for DNS  cert: pending
TXT _stackblaze-verify.shop.example.com not found; CNAME shop.example.com → fkzcqciuasaoyxoc.edge.stackblaze.cloud not found
Not verified yet. Until it is, other accounts can claim this domain too: the first claim whose TXT record verifies gets it, and the other claims are released.
┌───────┬─────────────────────────────────────┬────────────────────────────────────────────────────┬───────┐
│ Type  │ Name                                │ Value                                              │ Found │
├───────┼─────────────────────────────────────┼────────────────────────────────────────────────────┼───────┤
│ TXT   │ _stackblaze-verify.shop.example.com │ stackblaze-verify=3d4addb81a98383f5bc0688f8423c1fe │ no    │
├───────┼─────────────────────────────────────┼────────────────────────────────────────────────────┼───────┤
│ CNAME │ shop.example.com                    │ fkzcqciuasaoyxoc.edge.stackblaze.cloud             │ no    │
└───────┴─────────────────────────────────────┴────────────────────────────────────────────────────┴───────┘
shop.example.com is not active yet (waiting for DNS). Run `stackblaze domain verify shop.example.com --wait` to wait for it.
```
