Create a small sandbox called `scratch` in the `dev` environment. The environment flag is `--phase` here (`--env` sets variables inside the sandbox). The name gets a suffix:

```sh
stackblaze sandboxes create scratch --size 1x -p github-demo-cw8z --phase dev
```

```text
OK Sandbox scratch-mkwl is booting in github-demo-cw8z/dev (size 1x, 10Gi disk)
Shell: stackblaze sandboxes ssh scratch-mkwl -p github-demo-cw8z -e dev
VS Code: stackblaze sandboxes ide scratch-mkwl
```
