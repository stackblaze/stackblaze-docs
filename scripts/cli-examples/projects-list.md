List the projects and their environments:

```sh
stackblaze projects list
```

```text
┌───────────────────────┬────────────────────────┬────────┐
│ Project               │ Environments           │ Domain │
├───────────────────────┼────────────────────────┼────────┤
│ github-demo-587h      │ dev, stage, production │ —      │
├───────────────────────┼────────────────────────┼────────┤
…
├───────────────────────┼────────────────────────┼────────┤
│ github-demo-gv35      │ dev, stage, production │ —      │
├───────────────────────┼────────────────────────┼────────┤
│ github-demo-kpw0      │ dev, stage, production │ —      │
├───────────────────────┼────────────────────────┼────────┤
…
└───────────────────────┴────────────────────────┴────────┘
```

In a script, pick one project out of the `--json` list, e.g. to see whether preview environments (`reviewapps`) are on:

```sh
stackblaze projects list --json | jq '.[] | select(.name=="github-demo-gv35")'
```

```text
{
  "name": "github-demo-gv35",
  "displayName": null,
  "phases": [
    "dev",
    "stage",
    "production"
  ],
  "reviewapps": false,
  "strategy": "git"
}
```
