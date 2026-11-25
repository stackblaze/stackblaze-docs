The engine and current size of a database add-on, by its instance name:

```sh
stackblaze db info whiteboard-8stj-postgresql-6bt2 -p github-demo-cw8z -e dev
```

```text
whiteboard-8stj-postgresql-6bt2 (PostgreSQL (CloudNativePG))
  cpu:      8
  memory:   32Gi
  storage:  1Gi
```

The JSON also says what can be resized and whether high availability is on:

```sh
stackblaze db info db-qmwu -p import-demo-brkm -e dev --json
```

```text
{
  "instance": "db-qmwu",
  "kind": "Cluster",
  "engine": "PostgreSQL (CloudNativePG)",
  "provisioned": true,
  "communal": false,
  "ephemeral": false,
  "resize": {
    "supported": true,
    "cpu": true,
    "memory": true,
    "storage": true,
    "storageShrink": false
  },
  "ha": {
    "supported": true,
    "enabled": false,
    "canDisable": false,
    "viaPromotionJob": false
  },
  "current": {
    "cpu": "8",
    "memory": "32Gi",
    "storage": "1Gi"
  }
}
```
