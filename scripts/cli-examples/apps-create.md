Create an app from a Docker image in the `dev` environment, with its port and one variable, and wait until it is running.

```sh
stackblaze apps create hello-web -p github-demo-cw8z --phase dev \
  --image nginxinc/nginx-unprivileged:1.27-alpine --port 8080 \
  --env GREETING=hello --wait
```

```text
OK Created github-demo-cw8z/dev/hello-web (docker nginxinc/nginx-unprivileged:1.27-alpine)
Waiting for github-demo-cw8z/dev/hello-web-qw6y to be ready (up to 10m00s)…
  github-demo-cw8z/dev/hello-web-qw6y: deploying — Waiting for hello-web-qw6y-web deployment; rolling out (Deploy 1.27-alpine): waiting for the new pod (1s elapsed)
…
  github-demo-cw8z/dev/hello-web-qw6y: deploying — Deployment does not have minimum availability. (1m45s elapsed)
OK github-demo-cw8z/dev/hello-web-qw6y is ready
url: https://hello-web-qw6y.cloud-dev-central-1.stackblaze.app
```

The app keeps the name you gave it (`hello-web`); its resource name and URL get a short suffix (`hello-web-qw6y`).
