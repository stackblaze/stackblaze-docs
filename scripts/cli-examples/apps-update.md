Move an image app to a new tag and turn on the HTTP health check, so the new version only takes traffic once `/` answers.

```sh
stackblaze apps update hello-web -p github-demo-cw8z --phase dev \
  --tag 1.27.3-alpine --healthcheck-path /
```

```text
OK Updated github-demo-cw8z/dev/hello-web
image.tag, healthcheck.path=/, healthcheck on
```
