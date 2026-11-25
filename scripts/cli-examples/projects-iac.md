Check whether a project accepts `plan` and `apply`, turn Infrastructure as Code on, and later back off:

```sh
stackblaze projects iac -p github-demo-cw8z
stackblaze projects iac on -p github-demo-cw8z
```

```text
Infrastructure as Code is off for project github-demo-cw8z
apply/plan need it: stackblaze projects iac on -p github-demo-cw8z
OK Infrastructure as Code turned on for project github-demo-cw8z
`stackblaze plan` and `stackblaze apply` can now change project github-demo-cw8z.
```

```sh
stackblaze projects iac off -p github-demo-cw8z
stackblaze projects iac -p github-demo-cw8z --json
```

```text
OK Infrastructure as Code turned off for project github-demo-cw8z
apply and plan are refused for it until IaC is on again; export still works.
{
  "pipeline": "github-demo-cw8z",
  "iacEnabled": false
}
```
