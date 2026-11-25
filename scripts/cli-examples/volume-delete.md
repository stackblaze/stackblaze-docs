Detach a volume from an app. Type the volume name to confirm, or pass `-y`.

```sh
stackblaze volume delete data -p github-demo-cw8z -e stage -a vite-starter
stackblaze volume list -p github-demo-cw8z -e stage -a vite-starter
```

```text
!  This will detach volume data from the app.
Type the volume name to confirm: data
OK Removed volume data from github-demo-cw8z/stage/vite-starter-5tjx
No extra volumes on this app.
```
