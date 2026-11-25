Print the app's dashboard page and its public URL instead of opening them in the browser.

```sh
stackblaze open -p github-demo-gv35 -e dev -a nginx --no-browser
stackblaze open -p github-demo-gv35 -e dev -a nginx --app-url --no-browser
```

```text
https://dashboard-dev.stackblaze.cloud/pipeline/github-demo-gv35/dev/nginx-9agm/detail
https://nginx-9agm.cloud-dev-central-1.stackblaze.app
```
