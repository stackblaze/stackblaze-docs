Turn on tab completion for commands and flags. For bash, write the script where bash-completion looks for it (open a new shell afterwards):

```sh
stackblaze completion bash > ~/.local/share/bash-completion/completions/stackblaze
```

The script's header says how to install it for each shell:

```sh
stackblaze completion zsh | head -5
```

```text
#compdef stackblaze

# stackblaze shell completion (zsh), generated from the command tree
# Install: stackblaze completion zsh > "${fpath[1]}/_stackblaze"
# Or add to ~/.zshrc: source <(stackblaze completion zsh)
```

`fish` and `powershell` work the same way:

```sh
stackblaze completion powershell | head -3
```

```text
# stackblaze PowerShell completion, generated from the command tree
# Install (current session):  stackblaze completion powershell | Out-String | Invoke-Expression
# Install (every session):    stackblaze completion powershell >> $PROFILE
```
