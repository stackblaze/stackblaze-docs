The machine sizes for a sandbox, and which ones your plan allows. The disk comes with the size:

```sh
stackblaze sandboxes sizes -p github-demo-cw8z -e dev
```

```text
┌─────┬──────┬──────┬────────┬────────┬──────┐
│     │ Size │ vCPU │ Memory │ Disk   │ Plan │
├─────┼──────┼──────┼────────┼────────┼──────┤
│     │ 1x   │ 1    │ 2 GiB  │ 10 GiB │ ok   │
├─────┼──────┼──────┼────────┼────────┼──────┤
│ *   │ 2x   │ 2    │ 4 GiB  │ 20 GiB │ ok   │
├─────┼──────┼──────┼────────┼────────┼──────┤
│     │ 4x   │ 4    │ 8 GiB  │ 40 GiB │ ok   │
├─────┼──────┼──────┼────────┼────────┼──────┤
│     │ 8x   │ 8    │ 16 GiB │ 80 GiB │ ok   │
└─────┴──────┴──────┴────────┴────────┴──────┘
Business allows up to 8 vCPU / 32 GiB per sandbox.
image: ghcr.io/stackblaze/agent-sandbox:dev
* = default for `sandboxes create` without --size
```
