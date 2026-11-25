Change the name people see for an app. Its resource name, URL and data stay the same, and the new name works with `-a` and `apps get`.

```sh
stackblaze apps rename hello-web hello-site -p github-demo-cw8z -e dev
stackblaze apps get hello-site -p github-demo-cw8z -e dev
```

```text
OK Renamed github-demo-cw8z/dev/hello-web → hello-site
Only the name people see changed; the app, its URL and data are untouched.
OK github-demo-cw8z/dev/hello-site
resource: hello-web-qw6y
url:    https://hello-web-qw6y.cloud-dev-central-1.stackblaze.app
…
```
