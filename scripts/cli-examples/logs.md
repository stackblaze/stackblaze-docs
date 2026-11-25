Show the newest 8 lines of an app's web logs. Add `-f` to keep streaming.

```sh
stackblaze logs -p github-demo-gv35 -e dev -a nginx -n 8
```

```text
2026-11-25T14:43:02.085Z <ip> - - [25/Nov/2026:14:43:02 +0000] "GET / HTTP/1.1" 200 896 "-" "kube-probe/1.36" "-"
2026-11-25T14:43:05.085Z <ip> - - [25/Nov/2026:14:43:05 +0000] "GET / HTTP/1.1" 200 896 "-" "kube-probe/1.36" "-"
2026-11-25T14:43:05.582Z <ip> - - [25/Nov/2026:14:43:05 +0000] "GET / HTTP/1.1" 200 896 "-" "kube-probe/1.36" "-"
2026-11-25T14:43:08.085Z <ip> - - [25/Nov/2026:14:43:08 +0000] "GET / HTTP/1.1" 200 896 "-" "kube-probe/1.36" "-"
2026-11-25T14:43:11.085Z <ip> - - [25/Nov/2026:14:43:11 +0000] "GET / HTTP/1.1" 200 896 "-" "kube-probe/1.36" "-"
2026-11-25T14:43:14.085Z <ip> - - [25/Nov/2026:14:43:14 +0000] "GET / HTTP/1.1" 200 896 "-" "kube-probe/1.36" "-"
2026-11-25T14:43:15.582Z <ip> - - [25/Nov/2026:14:43:15 +0000] "GET / HTTP/1.1" 200 896 "-" "kube-probe/1.36" "-"
2026-11-25T14:43:17.085Z <ip> - - [25/Nov/2026:14:43:17 +0000] "GET / HTTP/1.1" 200 896 "-" "kube-probe/1.36" "-"
```
