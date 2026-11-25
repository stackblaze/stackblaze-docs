Stage a variable and a scale change, then ship both as one release.

```sh
stackblaze variables set RELEASE_CHANNEL=beta -p github-demo-cw8z -e dev -a hello-web --skip-deploy
stackblaze scale web=2 -p github-demo-cw8z -e dev -a hello-web --skip-deploy
stackblaze deploy --apply-pending -m "Beta channel on two instances" -p github-demo-cw8z -e dev -a hello-web
```

```text
OK Staged 1 change(s) for github-demo-cw8z/dev/hello-web-qw6y: RELEASE_CHANNEL
1 change(s) pending. Apply them as one release with `stackblaze pending apply` (or `stackblaze deploy --apply-pending`); drop them with `stackblaze pending discard`.
OK Staged 1 change(s) for github-demo-cw8z/dev/hello-web: scale:web
2 change(s) pending. Apply them as one release with `stackblaze pending apply` (or `stackblaze deploy --apply-pending`); drop them with `stackblaze pending discard`.
OK Applied staged changes to github-demo-cw8z/dev/hello-web-qw6y: RELEASE_CHANNEL, scale:web
One release: rolling out (config revision cmww8ehip0047wn01c2y75fn9). Follow it with `stackblaze deployments`.
```
