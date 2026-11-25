Show whether the app's ingress is on and which hosts it serves.

```sh
stackblaze domain status -p github-demo-cw8z -e dev -a hello-web
```

```text
OK github-demo-cw8z/dev/hello-web-qw6y
ingress: enabled
  hello-web-qw6y.cloud-dev-central-1.stackblaze.app  no tls record
```

A custom domain shows up here once it is verified; until then, check it with `stackblaze domain list`.
