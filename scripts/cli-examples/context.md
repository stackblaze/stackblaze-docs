Show which API, project, environment and app commands in this folder use, and where that came from:

```sh
stackblaze context
```

```text
Context
  api:         https://api-dev.stackblaze.cloud
  project:     github-demo-gv35
  environment: dev
  app:         nginx-9agm
  file:        .stackblaze/project.json
```

Flags override the link for one command. With `--json`:

```sh
stackblaze context --json -a other
```

```text
{
  "apiUrl": "https://api-dev.stackblaze.cloud",
  "scope": {
    "pipeline": "github-demo-gv35",
    "phase": "dev",
    "app": "other"
  },
  "effectivePhase": "dev",
  "projectFile": ".stackblaze/project.json"
}
```
