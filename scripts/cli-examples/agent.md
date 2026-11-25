Ask the agent a one-off question about an app. `-p`, `-e` and `-a` tell it which app you mean:

```sh
stackblaze agent -p github-demo-kpw0 -e dev -a nginx-unprivileged --plain "Is this app running, and which image and tag does it use? Don't change anything."
```

```text
  ⚙ get_app
Yes, it's running. The app is ready with 1/1 pods up, 0 restarts, and the URL is https://nginx-unprivileged-mi0u.cloud-dev-central-1.stackblaze.app.

It uses the image `ghcr.io/nginxinc/nginx-unprivileged` with tag `stable-alpine`.

One event is odd: the pod's events include `busybox:1.36` being pulled and started for the same pod. The app spec only lists the nginx image. This could be an init step, but I didn't confirm it. I made no changes.
```

Every prompt is saved as a session on this machine. List them, then carry on in one with `--thread-id`:

```sh
stackblaze agent --list
```

```text
┌──────────────────────────────────────┬──────────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ ID                                   │ Updated                  │ Preview                                                                │
├──────────────────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ 306ff0df-aea1-4b98-97e4-02160e69a047 │ 2026-11-25T14:44:07.423Z │ Is this app running, and which image and tag does it use? Don't chang… │
├──────────────────────────────────────┼──────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ 8f6b3c80-858d-4eb2-84f1-d291e43d8613 │ 2026-11-25T14:43:43.425Z │ Which add-ons does this environment have? Don't change anything.       │
…
└──────────────────────────────────────┴──────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```

```sh
stackblaze agent --thread-id 306ff0df-aea1-4b98-97e4-02160e69a047 -p github-demo-kpw0 -e dev -a nginx-unprivileged --plain "How many replicas does it run? One sentence."
```

```text
  ⚙ get_app
It runs 1 replica (web `replicaCount` 1, currently 1/1 ready), with autoscaling set to scale between 1 and 3 based on 70% CPU.
```
