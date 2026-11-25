Give a project a name people recognize. Only the display name changes; `-p`, URLs and environments keep using the ID:

```sh
stackblaze projects rename "Shop (docs demo)" -p github-demo-cw8z
stackblaze projects list
```

```text
OK Project github-demo-cw8z is now shown as "Shop (docs demo)"
Its ID stays github-demo-cw8z: commands, URLs and environments are unchanged.
┌───────────────────────┬──────────────────┬────────────────────────┬────────┐
│ Project               │ Name             │ Environments           │ Domain │
├───────────────────────┼──────────────────┼────────────────────────┼────────┤
…
├───────────────────────┼──────────────────┼────────────────────────┼────────┤
│ github-demo-cw8z      │ Shop (docs demo) │ dev, stage, production │ —      │
├───────────────────────┼──────────────────┼────────────────────────┼────────┤
…
```

Remove it again with `--clear`:

```sh
stackblaze projects rename --clear -p github-demo-cw8z
```

```text
OK Project github-demo-cw8z has no display name any more (its ID is shown)
Its ID stays github-demo-cw8z: commands, URLs and environments are unchanged.
```
