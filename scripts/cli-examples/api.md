Call an endpoint the CLI has no command for, with your saved sign-in. Here: which platform features are switched on:

```sh
stackblaze api GET /api/features
```

```text
{
  "functions": true,
  "sandboxes": true,
  "logDrains": true,
  "previews": true,
  "volumeSnapshots": true,
  "databaseBackups": true,
  "databasePublicAccess": true,
  "fileBrowser": true,
  "iac": true,
  "tracing": true,
  "aiModels": true,
  "aiAgents": true
}
```

The body is printed whatever the status, and the exit code says how it went (1 for a 404):

```sh
stackblaze api GET /api/pipelines/no-such-project; echo "exit $?"
```

```text
{
  "message": "Pipeline not found: no-such-project",
  "error": "Not Found",
  "statusCode": 404
}
x  HTTP 404: Pipeline not found: no-such-project
exit 1
```
