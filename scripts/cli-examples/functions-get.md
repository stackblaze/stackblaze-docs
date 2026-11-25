Show how a function runs and whether it is awake, then print its code.

```sh
stackblaze functions get hello -p github-demo-cw8z -e dev
stackblaze functions get hello -p github-demo-cw8z -e dev --code
```

```text
OK github-demo-cw8z/dev/hello
runs:   on request (TypeScript on Bun)
url:    https://hello-4qcf.cloud-dev-central-1.stackblaze.app
status: sleeping (wakes on the next request)
code:   242 bytes (print it with --code)
Bun.serve({
  port: Number(process.env.PORT ?? 8080),
  async fetch(req) {
    const name = req.method === "POST" ? (await req.text()) || "world" : "world";
    return Response.json({ hello: name, path: new URL(req.url).pathname });
  },
});
```
