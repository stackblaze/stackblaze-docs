Link the current folder to the `nginx-9agm` app in the `dev` environment of `github-demo-gv35`, so later commands run in this folder need no `-p/-e/-a`:

```sh
cd shop
stackblaze link -p github-demo-gv35 -e dev -a nginx-9agm
```

```text
OK Linked github-demo-gv35 / dev / nginx
saved to /tmp/shop/.stackblaze/project.json
```
