The AI models of an environment. This one has none yet:

```sh
stackblaze models list -p github-demo-cw8z -e dev
```

```text
OK github-demo-cw8z/dev AI models
No AI models. Deploy one: stackblaze models deploy <model>  (see `stackblaze models sizes`)
```

```sh
stackblaze models list -p github-demo-cw8z -e dev --json
```

```text
{
  "pipeline": "github-demo-cw8z",
  "phase": "dev",
  "models": []
}
```
