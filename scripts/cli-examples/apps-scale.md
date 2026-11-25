Turn on autoscaling between 1 and 3 web instances, then go back to a fixed single instance.

```sh
stackblaze apps scale -p github-demo-cw8z -e dev -a hello-web --autoscale web=1:3 -m "Autoscale web"
stackblaze apps scale -p github-demo-cw8z -e dev -a hello-web --autoscale-off web web=1
```

```text
OK Scaled github-demo-cw8z/dev/hello-web web → autoscaling 1–3
OK Scaled github-demo-cw8z/dev/hello-web web → 1 instance(s) (was 2), autoscaling off
```
