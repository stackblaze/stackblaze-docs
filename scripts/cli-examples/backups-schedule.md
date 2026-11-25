See whether the environment is backed up on a schedule. The CLI only reads it; you turn it on in the dashboard:

```sh
stackblaze backups schedule -p github-demo-cw8z -e dev
```

```text
OK github-demo-cw8z/dev scheduled backups: off
Set the schedule in the dashboard (environment → Backups). The CLI never creates a schedule.
```

The JSON lists each cadence with its cron and how long its points are kept:

```sh
stackblaze backups schedule -p github-demo-cw8z -e dev --json
```

```text
{
  "pipeline": "github-demo-cw8z",
  "phase": "dev",
  "cadences": [
    {
      "id": "6h",
      "enabled": false,
      "retentionHours": 168,
      "cron": "0 */6 * * *"
    },
    {
      "id": "daily",
      "enabled": false,
      "retentionHours": 144,
      "cron": "0 2 * * *"
    },
    {
      "id": "weekly",
      "enabled": false,
      "retentionHours": 720,
      "cron": "0 3 * * 0"
    },
    {
      "id": "monthly",
      "enabled": false,
      "retentionHours": 720,
      "cron": "0 4 1 * *"
    }
  ],
  "pvcNames": null
}
```
