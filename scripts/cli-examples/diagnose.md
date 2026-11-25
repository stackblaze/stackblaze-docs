Check an app for platform-level problems: its status and resources, error lines in the recent logs, and its add-ons.

```sh
stackblaze diagnose -p github-demo-gv35 -e dev -a nginx
```

```text
Diagnosing github-demo-gv35/dev/nginx-9agm…
OK github-demo-gv35/dev/nginx-9agm
host: nginx-9agm.cloud-dev-central-1.stackblaze.app
status: running
resources: 0m CPU, 6Mi mem

OK No obvious platform-level issues detected.
No obvious platform-level bottlenecks — check application code, external APIs, or widen --scale / --log-minutes.
No HTTP latency metrics — ingress may be disabled or metrics unavailable.
```
