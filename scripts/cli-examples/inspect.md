See how StackBlaze would deploy a folder before you run `stackblaze up`. This one has a Dockerfile that exposes port 8080:

```sh
cd shop-api
cat Dockerfile
stackblaze inspect
```

```text
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY index.html /usr/share/nginx/html/
EXPOSE 8080
Repo type: single
app  context=.  dockerfile=Dockerfile  port=8080
```

A public git URL works too:

```sh
stackblaze inspect https://github.com/stackblaze/react-vite-starter
```

```text
Repo type: git-only
No Dockerfile or compose file — deploys as one app built from source (git mode, railpack by default).
```
