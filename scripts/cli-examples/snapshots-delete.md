Delete one snapshot (a name from `snapshots list`). Type the snapshot name to confirm, or pass `-y`. The volume itself stays as it is.

```sh
stackblaze snapshots delete vite-starter-5tjx-data-1795619211011 -p github-demo-cw8z -e stage -a vite-starter
stackblaze snapshots list -p github-demo-cw8z -e stage -a vite-starter
```

```text
!  This deletes snapshot vite-starter-5tjx-data-1795619211011 of volume data (github-demo-cw8z/stage/vite-starter-5tjx). The volume itself is not touched.
Type the snapshot name to confirm: vite-starter-5tjx-data-1795619211011
OK Deleted snapshot vite-starter-5tjx-data-1795619211011 (data)
data  1Gi
```
