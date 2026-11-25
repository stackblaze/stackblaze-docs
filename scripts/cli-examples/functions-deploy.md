Create a function from one TypeScript file and wait until it is ready. Running the same command again with a changed file updates its code.

```sh
cat hello.ts
stackblaze functions deploy hello --file hello.ts --wait -p github-demo-cw8z -e dev
```

```text
Bun.serve({
  port: Number(process.env.PORT ?? 8080),
  async fetch(req) {
    const name = req.method === "POST" ? (await req.text()) || "world" : "world";
    return Response.json({ hello: name, path: new URL(req.url).pathname });
  },
});
Waiting for function hello-4qcf…
  hello-4qcf: Waiting for hello-4qcf-kuberoapp-web deployment
OK Function hello is ready
url: https://hello-4qcf.cloud-dev-central-1.stackblaze.app
```
