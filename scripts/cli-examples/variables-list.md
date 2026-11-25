List an app's variables. Values are masked unless you pass `--reveal` (needs write access to the app).

```sh
stackblaze variables list -p github-demo-cw8z -e dev -a hello-web
stackblaze variables list -p github-demo-cw8z -e dev -a hello-web --reveal
```

```text
OK github-demo-cw8z/dev/hello-web-qw6y
  GREETING=••••••••
  PORT=••••••••
Values are masked; pass --reveal to show them (needs write access).
OK github-demo-cw8z/dev/hello-web-qw6y
  GREETING=hello
  PORT=8080
  LOG_LEVEL=debug
  FEATURE_SEARCH=on
```

The second listing is after the `variables set` example. Add `--all` to include the variables the platform injects.
