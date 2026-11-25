Run two web instances, with a release message for the deployments timeline.

```sh
stackblaze scale web=2 -p github-demo-cw8z -e dev -a hello-web -m "More capacity for launch"
```

```text
OK Scaled github-demo-cw8z/dev/hello-web web → 2 instance(s) (was 1)
```
