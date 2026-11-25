Show the newest 10 events of an app: pods being scheduled, images pulled, containers started and stopped.

```sh
stackblaze events -p github-demo-gv35 -e dev -a nginx -n 10
```

```text
OK github-demo-gv35/dev/nginx-9agm
  (newest 10 of 31; -n <count> for more)
  Killing: Stopping container web
  SuccessfulCreate: Created pod: nginx-9agm-web-78d78c7586-bhm6w
  Scheduled: Successfully assigned github-demo-gv35-dev/nginx-9agm-web-78d78c7586-bhm6w to cloud-dev-central-1-tenant-strxl-889ff
  Pulled: Container image "busybox:1.36" already present on machine and can be accessed by the pod
  Created: Container created
  Started: Container started
  Pulling: Pulling image "nginx:latest"
  Pulled: Successfully pulled image "nginx:latest" in 535ms (535ms including waiting). Image size: 63922276 bytes.
  Created: Container created
  Started: Container started
```
