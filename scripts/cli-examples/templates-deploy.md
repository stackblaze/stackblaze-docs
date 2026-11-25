Deploy the Excalidraw template into the `dev` environment as an app called `whiteboard`, and wait until it is up. The environment flag is `--phase` here:

```sh
stackblaze templates deploy excalidraw -p github-demo-cw8z --phase dev --name whiteboard --wait
```

```text
OK Deployed template excalidraw → github-demo-cw8z/dev/whiteboard
Waiting for github-demo-cw8z/dev/whiteboard-8stj to be ready (up to 10m00s)…
  github-demo-cw8z/dev/whiteboard-8stj: deploying — Waiting for whiteboard-8stj-web deployment; rolling out (Deploy 2026.11.12-1440f2d): waiting for the new pod (2s elapsed)
…
  github-demo-cw8z/dev/whiteboard-8stj: deploying — Waiting for whiteboard-8stj-web deployment (1m22s elapsed)
OK github-demo-cw8z/dev/whiteboard-8stj is ready
url: https://whiteboard-8stj.cloud-dev-central-1.stackblaze.app
```
