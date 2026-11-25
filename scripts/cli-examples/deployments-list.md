Show an app's last five deploys: image deploys, redeploys and config releases, with the message each one was shipped with.

```sh
stackblaze deployments list -p github-demo-cw8z -e dev -a hello-web -n 5
```

```text
┌───────────────────────────┬────────────┬─────────────────┬───────────────────────────────────────────┬────────────────────────────────┬──────────────────────────┐
│ ID                        │ Status     │ Trigger         │ Ref                                       │ Message                        │ Created                  │
├───────────────────────────┼────────────┼─────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────────────────┤
│ cmww8ehr10048wn01ja1kspc2 │ live       │ config          │ nginxinc/nginx-unprivileged:1.27.4-alpine │ Beta channel on two instances  │ 2026-11-25T14:41:15.613Z │
├───────────────────────────┼────────────┼─────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────────────────┤
│ cmww8dg8t009iuz01803q6juc │ canceled   │ tag_deploy      │ nginxinc/nginx-unprivileged:1.27.4-alpine │ nginx 1.27.4                   │ 2026-11-25T14:40:27.006Z │
├───────────────────────────┼────────────┼─────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────────────────┤
│ cmww8bms8008quz014dxaeq6m │ superseded │ manual_redeploy │ nginxinc/nginx-unprivileged:1.27.3-alpine │ Pick up the patched base image │ 2026-11-25T14:39:02.169Z │
├───────────────────────────┼────────────┼─────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────────────────┤
│ cmww89o0r0085uz017g5ufyyb │ superseded │ manual_redeploy │ nginxinc/nginx-unprivileged:1.27.3-alpine │ Restarted                      │ 2026-11-25T14:37:30.460Z │
├───────────────────────────┼────────────┼─────────────────┼───────────────────────────────────────────┼────────────────────────────────┼──────────────────────────┤
│ cmww886rq007muz0149xv0gdr │ superseded │ manual_redeploy │ nginxinc/nginx-unprivileged:1.27.3-alpine │ Restarted                      │ 2026-11-25T14:36:21.447Z │
└───────────────────────────┴────────────┴─────────────────┴───────────────────────────────────────────┴────────────────────────────────┴──────────────────────────┘
```

Pass an ID to `stackblaze deployments rollback` to go back to that deploy.
