List an app's domains: its platform hostname and any custom domains, with verification and certificate status.

```sh
stackblaze domain list -p github-demo-cw8z -e dev -a hello-web
```

```text
OK github-demo-cw8z/dev/hello-web-qw6y
┌───────────────────────────────────────────────────┬──────────┬─────────────────┬─────────────┐
│ Host                                              │ Type     │ Status          │ Certificate │
├───────────────────────────────────────────────────┼──────────┼─────────────────┼─────────────┤
│ hello-web-qw6y.cloud-dev-central-1.stackblaze.app │ platform │ active          │ ready       │
├───────────────────────────────────────────────────┼──────────┼─────────────────┼─────────────┤
│ shop.example.com                                  │ custom   │ waiting for DNS │ pending     │
└───────────────────────────────────────────────────┴──────────┴─────────────────┴─────────────┘
shop.example.com: TXT _stackblaze-verify.shop.example.com not found; CNAME shop.example.com → fkzcqciuasaoyxoc.edge.stackblaze.cloud not found
shop.example.com: Not verified yet. Until it is, other accounts can claim this domain too: the first claim whose TXT record verifies gets it, and the other claims are released.
```
