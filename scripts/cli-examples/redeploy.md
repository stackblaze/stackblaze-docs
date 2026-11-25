Re-pull an image app's current tag (for example after the image was rebuilt upstream), with a release message.

```sh
stackblaze redeploy -p github-demo-cw8z -e dev -a hello-web -m "Pick up the patched base image"
```

```text
OK Redeploying github-demo-cw8z/dev/hello-web — re-pulling nginxinc/nginx-unprivileged:1.27.3-alpine
```
