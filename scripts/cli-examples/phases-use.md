Switch a folder linked to `github-demo-gv35` / `dev` over to the `stage` environment, then check the result:

```sh
stackblaze phases use stage
stackblaze context
```

```text
OK Using environment stage of github-demo-gv35
saved to /tmp/shop/.stackblaze/project.json
Context
  api:         https://api-dev.stackblaze.cloud
  project:     github-demo-gv35
  environment: stage
  app:         (none)
  file:        .stackblaze/project.json
```
