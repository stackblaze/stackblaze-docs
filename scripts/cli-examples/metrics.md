Show each pod's CPU and memory now, then the last 24 hours as sparklines.

```sh
stackblaze metrics -p github-demo-gv35 -e dev -a nginx
stackblaze metrics -p github-demo-gv35 -e dev -a nginx --since 24h
```

```text
OK github-demo-gv35/dev/nginx-9agm
  nginx-9agm-web-78d78c7586-bhm6w  cpu: 0m  mem: 6Mi
OK github-demo-gv35/dev/nginx-9agm — last 24h
  cpu       ▁▁▁▁▁▁▁▁▁▁▁█▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁  now 0m  avg 0m  max 8m
  memory    ▁▁▁█▃▁▁▁▁▁▁▁▁▁▁▃▁▁▃▁▃▁▁▁▁▁▃▁▁▃▁▁▁▁▁▁▁▃▁▁  now 6.5MB  avg 7.0MB  max 19.4MB
  requests  ▆▅█▁▄▆▇▆▆▆▆▆▆▆▆▆█▅▅▆▅▆▆▆▆▆▆▆▅▆▆▆▆▆▅▆▅▆▆▅  now 0.43/s  avg 0.43/s  max 0.51/s
  latency   ▃▃▃▃▃▄▅▃█▅█▆▄▆█▆▂▂▄▂▃▅▄▃▅▄▃▁▁▃▃▃▃▄▁▁▁▂▂▃  now 0.1ms  avg 0.1ms  max 0.2ms
```
