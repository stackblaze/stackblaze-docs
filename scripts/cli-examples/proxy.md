Reach the app's port 8080 on `127.0.0.1:8080` without exposing it publicly, then call it from a second terminal.

```sh
stackblaze proxy 8080:8080 -p github-demo-cw8z -e dev -a hello-web-qw6y
```

```text
Forwarding 127.0.0.1:8080 → hello-web-qw6y:8080  [github-demo-cw8z/dev]
  URL:  http://127.0.0.1:8080
Press Ctrl-C to close.
```

```sh
curl -sS -I http://127.0.0.1:8080/ | head -3
```

```text
HTTP/1.1 200 OK
Server: nginx/1.27.3
Date: Wed, 25 Nov 2026 14:48:26 GMT
```
