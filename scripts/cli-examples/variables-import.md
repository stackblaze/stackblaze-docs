Set every variable from a `.env` file in one release. Variables that aren't in the file stay as they are (pass `--replace` to remove them).

```sh
cat .env.production
stackblaze variables import .env.production -p github-demo-cw8z -e dev -a hello-web -m "Import production settings"
```

```text
CACHE_TTL=300
SUPPORT_EMAIL=help@example.com
OK Imported into github-demo-cw8z/dev/hello-web-qw6y: CACHE_TTL, SUPPORT_EMAIL
One release: rolling out (config revision cmww82bif005puz01d5nsbwb5). Follow it with `stackblaze deployments`.
```
