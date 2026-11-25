# CLI reference examples

One file per command (leaf command: no further subcommands), named after the command path
joined with `-`: `cron-set.md`, `addons-backups-list.md`, `logs.md`. `gen-cli-reference.mjs`
puts it under that command's help as **Example**.

Rules:
- Every example was actually run, against dev, with the released CLI. Paste the real command
  and its real output; trim long output with `…` but never edit what's kept.
- Mask account emails, tokens, keys, passwords, IPs and private repos. Use the docs test
  projects only.
- Shape: a sentence saying what the example does, a `sh` block with the command(s),
  then a `text` block with the output. Destructive commands show the confirmation too.
- Leave commands for features that are off on production out (see OFF_GROUPS).

After a change: `node scripts/gen-cli-reference.mjs <path to stackblaze>`; `MISSING.txt`
lists the commands that still have no example.
