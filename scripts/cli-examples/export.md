Write one project and its apps out as manifests in `./stackblaze`. Variable values and credentials are masked:

```sh
stackblaze export -p github-demo-gv35
```

```text
  wrote github-demo-gv35.project.yaml
  wrote github-demo-gv35.dev.nginx-9agm.app.yaml
OK Exported 1 project(s) and 1 app(s) to ~/stackblaze
Variable values and credentials are written as ******** (apply keeps the current value); pass --reveal to write them in plaintext.
```
