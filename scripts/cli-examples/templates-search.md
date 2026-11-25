Find a template by what it does, then by category. The id in the first column is what `templates deploy` takes:

```sh
stackblaze templates search whiteboard
stackblaze templates search --category monitoring
```

```text
1 match(es) of 54 template(s) for "whiteboard"
Deploy one with: stackblaze templates deploy <id>
excalidraw  excalidraw — Virtual whiteboard for sketching hand-drawn style diagrams, with live collaboration and shareable links that are end-to-end encrypted and stored on your own instance.
1 match(es) of 54 template(s)
Deploy one with: stackblaze templates deploy <id>
uptime-kuma  uptime-kuma — Self-hosted uptime monitoring. Check websites, APIs, ports, DNS and more on your own schedule, get alerts in 90+ notification services, and publish public status pages.  addons: MariaDB, Smtp
```

With `--json`, each template also lists its categories, add-ons and variants (`deploymentTypes`):

```sh
stackblaze templates search whiteboard --json
```

```text
{
  "total": 54,
  "matched": 1,
  "templates": [
    {
      "id": "excalidraw",
      "name": "excalidraw",
      "description": "Virtual whiteboard for sketching hand-drawn style diagrams, with live collaboration and shareable links that are end-to-end encrypted and stored on your own instance.",
      "categories": [
        "documentation",
        "work",
        "collaboration"
      ],
      "addons": [],
      "deploymentTypes": [
        "standard"
      ],
      "locked": false,
      "lockReason": null,
      "haLocked": null
    }
  ]
}
```
