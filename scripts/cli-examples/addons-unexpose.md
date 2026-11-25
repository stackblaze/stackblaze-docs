Turn public access off again. The database stays reachable from your apps:

```sh
stackblaze addons unexpose whiteboard-8stj-postgresql-6bt2 -p github-demo-cw8z -e dev -a whiteboard
```

```text
OK whiteboard-8stj-postgresql-6bt2 is no longer public (reachable from inside the platform only)
```
