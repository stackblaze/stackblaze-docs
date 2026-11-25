Snapshot every volume of an app at once. The snapshots share one group ID, which `snapshots clone` restores from.

```sh
stackblaze snapshots create -p github-demo-cw8z -e stage -a vite-starter
```

```text
OK Snapshot group snap-vite-starter-5tjx-1795619210271
1 volume(s) snapshotted
```
