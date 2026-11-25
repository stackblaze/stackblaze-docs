Call a function with a request body (POST by default), then with a GET on another path. A sleeping function wakes for the call.

```sh
stackblaze functions invoke hello -p github-demo-cw8z -e dev --body Ada
stackblaze functions invoke hello -p github-demo-cw8z -e dev --method GET --path /status
```

```text
OK Invoked hello (HTTP 200)
{"hello":"Ada","path":"/"}
OK Invoked hello (HTTP 200)
{"hello":"world","path":"/status"}
```
