Check that the API answers, whether Infrastructure as Code is on for a project, and the state of one app.

```sh
stackblaze status -p github-demo-gv35 -e dev -a nginx
```

```text
OK API reachable (13 project(s))
Infrastructure as Code is off for project github-demo-gv35 (apply and plan need it; export works without it). Turn it on with `stackblaze projects iac on -p github-demo-gv35`
api:       https://api-dev.stackblaze.cloud
organization: <org-id>
projects:  13
app:       github-demo-gv35/dev/nginx — running
```
