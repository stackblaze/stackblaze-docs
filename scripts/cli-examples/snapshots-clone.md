Restore a snapshot group as a new app, `vite-starter-restore`, with volumes made from the snapshots. The original app isn't touched. `--wait` follows the copy until it is done; the new app then builds and starts on its own (`stackblaze wait` follows that). Afterwards the new app has the file that was on the volume when the snapshot was taken.

```sh
stackblaze snapshots clone snap-vite-starter-5tjx-1795619210271 vite-starter-restore --wait -p github-demo-cw8z -e stage -a vite-starter
stackblaze ssh -p github-demo-cw8z -e stage -a vite-starter-restore --command 'cat /data/orders.txt'
```

```text
OK Cloned vite-starter-5tjx into new app vite-starter-restore-0g7r
order 1001
```
