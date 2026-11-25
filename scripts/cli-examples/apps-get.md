Show an app's resource name, public URL, status, pod count and number of variables.

```sh
stackblaze apps get hello-web -p github-demo-cw8z -e dev
```

```text
OK github-demo-cw8z/dev/hello-web
resource: hello-web-qw6y
url:    https://hello-web-qw6y.cloud-dev-central-1.stackblaze.app
status: running
pods:   1
env:    2 variable(s)
```

Add `--json` for the full spec (image, health check, ingress, resources, variables with masked values).
