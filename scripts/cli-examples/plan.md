Preview what a folder of manifests would change before you apply it. `infra/shop-api.app.yaml` declares one new app:

```yaml
apiVersion: stackblaze.com/v1
kind: StackBlazeApp
metadata:
  name: shop-api
  pipeline: github-demo-cw8z
  phase: dev
spec:
  deploymentstrategy: docker
  image:
    repository: nginxinc/nginx-unprivileged
    tag: "1.27"
    containerPort: 8080
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 256Mi
  web:
    replicaCount: 1
```

```sh
stackblaze plan infra/
```

```text
create app github-demo-cw8z/dev/shop-api

Plan: 1 to create, 0 to update
```

With `--json`, e.g. to fail a CI job when anything would change:

```sh
stackblaze plan infra/ --json
```

```text
{
  "create": 1,
  "update": 0,
  "unchanged": 0,
  "resources": [
    {
      "kind": "StackBlazeApp",
      "name": "shop-api",
      "pipeline": "github-demo-cw8z",
      "phase": "dev",
      "action": "create"
    }
  ]
}
```

While the project's Infrastructure as Code switch is off, plan is refused (exit 3):

```sh
stackblaze plan infra/
```

```text
x  plan failed for app github-demo-cw8z/dev/shop-api: Infrastructure as Code is not enabled for project "github-demo-cw8z". Enable it under Project Settings → General → Infrastructure as Code. Or from the CLI: stackblaze projects iac on -p github-demo-cw8z
```
