Wait for a rollout to finish (here, after `apps update` changed the image tag). The command exits when the app is ready, or with an error after `--timeout`.

```sh
stackblaze wait -p github-demo-cw8z -e dev -a hello-web
```

```text
Waiting for github-demo-cw8z/dev/hello-web-qw6y to be ready (up to 10m00s)…
  github-demo-cw8z/dev/hello-web-qw6y: deploying — Rolling out new version; rolling out (Updated image nginxinc/nginx-unprivileged:1.27-alpine → nginxinc/nginx-unprivileged:1.27.3-alpine, health check): waiting for the new pod (2s elapsed)
…
  github-demo-cw8z/dev/hello-web-qw6y: deploying — Rolling out hello-web-qw6y-web (1m07s elapsed)
OK github-demo-cw8z/dev/hello-web-qw6y is ready
url: https://hello-web-qw6y.cloud-dev-central-1.stackblaze.app
```
