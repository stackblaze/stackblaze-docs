Follow a build (a name from `builds list`) live, from cloning the repository to pushing the image. The command exits when the build finishes, with 1 if it failed.

```sh
stackblaze builds logs vite-starter-5tjx-github-demo-cw-20261125-150148-59ba -f -p github-demo-cw8z -e stage -a vite-starter
```

```text
Streaming logs for build vite-starter-5tjx-github-demo-cw-20261125-150148-59ba (Active)
[fetch] ========== clone https://github.com/stackblaze/react-vite-starter.git (ref main)
[fetch] Cloning into '.'...
…
[fetch] HEAD is now at 92fdae6 Remove build artifacts and pnpm workspace file from starter.
                   
╭─────────────────╮
│ Railpack 0.39.0 │
╰─────────────────╯
  ↳ Detected Node
  ↳ Using pnpm package manager
  ↳ Deploying as vite static site
  ↳ Output directory: dist
…
[push] #25 exporting to image
[push] #25 pushing layers 5.1s done
…
[push] #25 DONE 6.3s
…
build vite-starter-5tjx-github-demo-cw-20261125-150148-59ba → Succeeded
OK Build vite-starter-5tjx-github-demo-cw-20261125-150148-59ba finished (Succeeded)
```

Leave out the build name to follow the latest build; leave out `-f` to poll instead of streaming.
