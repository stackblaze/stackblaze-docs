List a project's preview apps, here narrowed to one environment. This project has none yet:

```sh
stackblaze previews list -p github-demo-gv35 -e dev
```

```text
No preview environments in project github-demo-gv35 (environment dev).
```

In a script, `--json` prints an empty list:

```sh
stackblaze previews list -p github-demo-gv35 --json
```

```text
[]
```
