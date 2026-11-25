Deploy a local folder with a Dockerfile. It isn't a git checkout, so `up` packs and uploads it, builds it, and with `--wait` waits until the new app is running. The app is named after the folder.

```sh
cd shop-api
stackblaze up -p github-demo-cw8z --phase stage --wait -m "First deploy"
```

```text
Packing <path>/shop-api: 2 files, 114 B (respects .gitignore and .stackblazeignore)
Archive: 218 B compressed (sha256 3168282b2f52)
port 8080 (EXPOSE in Dockerfile; pass --port <n> to change it)
Uploading: 100% (218 B/218 B)
OK Building github-demo-cw8z/stage/shop-api from local upload 3168282b2f52
build shop-api-nhi0-github-demo-cw8z-20261125-150407-b690 (Unknown)
build shop-api-nhi0-github-demo-cw8z-20261125-150407-b690 → Active
[fetch] ========== fetch uploaded source (sha256 3168282b2f52a5ed42f840c32977942d09bf647c534ef276bf46518e2144f3ae)
[fetch] downloaded 218 bytes
…
[push] STEP 1/3: FROM nginxinc/nginx-unprivileged:1.27-alpine
…
[push] Writing manifest to image destination
…
build shop-api-nhi0-github-demo-cw8z-20261125-150407-b690 → Succeeded
Waiting for github-demo-cw8z/stage/shop-api-nhi0 to be ready (up to 10m00s)…
OK github-demo-cw8z/stage/shop-api-nhi0 is ready
url: https://shop-api-nhi0.cloud-dev-central-1.stackblaze.app
```
