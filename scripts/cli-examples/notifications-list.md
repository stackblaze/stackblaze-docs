List the organization's notifications. Webhook URLs and secrets stay hidden:

```sh
stackblaze notifications list
```

```text
┌──────────────┬─────────┬─────┬──────────────────┬──────────────────────┬───────────────────────────┐
│ Name         │ Type    │ On  │ Projects         │ Events               │ Id                        │
├──────────────┼─────────┼─────┼──────────────────┼──────────────────────┼───────────────────────────┤
│ docs-deploys │ webhook │ no  │ github-demo-cw8z │ deployApp, deleteApp │ cmww853ip006guz014j6zggnz │
└──────────────┴─────────┴─────┴──────────────────┴──────────────────────┴───────────────────────────┘
Webhook URLs and secrets are not shown; --reveal --json prints them.
```

With `--json` (add `--reveal` to get the URL and secret too):

```sh
stackblaze notifications list --json
```

```text
[
  {
    "id": "cmww853ip006guz014j6zggnz",
    "name": "docs-deploys",
    "type": "webhook",
    "enabled": false,
    "pipelines": [
      "github-demo-cw8z"
    ],
    "events": [
      "deployApp",
      "deleteApp"
    ],
    "config": {
      "url": "********",
      "secret": "********"
    }
  }
]
```
