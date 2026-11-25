Show who changed an app recently:

```sh
stackblaze audit -p github-demo-gv35 -e dev -a nginx-9agm -n 3
```

```text
3 event(s) for github-demo-gv35/dev/nginx-9agm
2026-11-25T13:12:07.311Z  ready  system  github-demo-gv35/dev/nginx-9agm — App ready: nginx in github-demo-gv35/dev at https://nginx-9agm.cloud-dev-central-1.stackblaze.app
2026-11-25T13:11:02.881Z  update  <email>  github-demo-gv35/dev/nginx-9agm — Updated app: nginx-9agm in github-demo-gv35 phase: dev
2026-11-25T13:10:39.341Z  update  <email>  github-demo-gv35/dev/nginx-9agm — Updated app: nginx-9agm in github-demo-gv35 phase: dev
```

Without `-a` it reads the whole organization's trail. Find the latest deletions:

```sh
stackblaze audit --action delete -n 3
```

```text
3 event(s)
2026-11-25T14:01:35.199Z  delete  <email>  github-demo-cw8z/dev/val3-echo-nev8 — Deleted app: val3-echo-nev8 in github-demo-cw8z phase: dev
2026-11-25T14:01:34.111Z  delete  <email>  github-demo-cw8z/dev/ai-gateway-yu7u — Deleted app: ai-gateway-yu7u in github-demo-cw8z phase: dev
2026-11-25T14:01:30.791Z  delete  <email>  github-demo-cw8z/dev/val3b-pi2x — Deleted app: val3b-pi2x in github-demo-cw8z phase: dev
```
