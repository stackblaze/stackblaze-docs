Add a custom domain to an app. The CLI prints the two DNS records to create at your DNS provider.

```sh
stackblaze domain add shop.example.com -p github-demo-cw8z -e dev -a hello-web
```

```text
OK Added shop.example.com to github-demo-cw8z/dev/hello-web-qw6y
Create these DNS records at your DNS provider:
┌───────┬─────────────────────────────────────┬────────────────────────────────────────────────────┬───────┐
│ Type  │ Name                                │ Value                                              │ Found │
├───────┼─────────────────────────────────────┼────────────────────────────────────────────────────┼───────┤
│ TXT   │ _stackblaze-verify.shop.example.com │ stackblaze-verify=3d4addb81a98383f5bc0688f8423c1fe │ no    │
├───────┼─────────────────────────────────────┼────────────────────────────────────────────────────┼───────┤
│ CNAME │ shop.example.com                    │ fkzcqciuasaoyxoc.edge.stackblaze.cloud             │ no    │
└───────┴─────────────────────────────────────┴────────────────────────────────────────────────────┴───────┘
Not verified yet. Until it is, other accounts can claim this domain too: the first claim whose TXT record verifies gets it, and the other claims are released.
Then run `stackblaze domain verify shop.example.com` (or add --wait) — the platform also re-checks every 5 minutes.
```
