Roll back to an earlier deploy from `deployments list` (its image and the configuration it ran with) and wait until the app is up again. Type `yes` to confirm, or pass `-y`.

```sh
stackblaze deployments rollback cmww8bms8008quz014dxaeq6m --wait -p github-demo-cw8z -e dev -a hello-web
```

```text
!  This will roll github-demo-cw8z/dev/hello-web-qw6y back to image tag 1.27.3-alpine and the configuration it ran with (deploy cmww8bms8008quz014dxaeq6m).
!  Auto-deploy turns off, so the next push does not bring the change back. Add-ons, volumes and domains stay as they are.
Type "yes" to continue: yes
OK Rolled back github-demo-cw8z/dev/hello-web-qw6y → tag 1.27.3-alpine + its configuration (deploy cmww8bms8008quz014dxaeq6m)
Auto-deploy is off. Turn it back on in the app's settings in the dashboard once the fix is pushed.
Waiting for github-demo-cw8z/dev/hello-web-qw6y to be ready (up to 10m00s)…
OK github-demo-cw8z/dev/hello-web-qw6y is ready
url: https://hello-web-qw6y.cloud-dev-central-1.stackblaze.app
```
