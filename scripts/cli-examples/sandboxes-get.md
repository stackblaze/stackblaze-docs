One sandbox's status, size, image, workspace disk and VS Code address. While it waits for a machine, the note says why:

```sh
stackblaze sandboxes get scratch-mkwl -p github-demo-cw8z -e dev
```

```text
OK github-demo-cw8z/dev/scratch-mkwl  pending
size        1x
image       ghcr.io/stackblaze/agent-sandbox:dev@sha256:9e19299090c2ac2dc81a8fa68876b861f0d14981c1b14222c2826acf66196d99
workspace   /workspace (10Gi, volume scratch-mkwl-workspace)
vs code     https://scratch-mkwl.cloud-dev-central-1.stackblaze.app
created     2026-11-25T14:39:05.673Z by <email>
note        Waiting for capacity — the sandbox nodes are out of CPU or memory. It starts automatically when room frees up.
```
