Start a new build of a git app from the head of `main`, then follow it with `builds logs -f`.

```sh
stackblaze builds trigger -p github-demo-cw8z -e stage -a vite-starter --reference main
```

```text
OK Build triggered for github-demo-cw8z/stage/vite-starter-5tjx
```
