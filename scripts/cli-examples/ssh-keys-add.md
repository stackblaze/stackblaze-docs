Add a public key to your account so `stackblaze ssh --native`, `scp` and `sftp` can use it:

```sh
ssh-keygen -q -t ed25519 -f ./laptop-key -N '' -C docs-laptop
stackblaze ssh-keys add laptop-key.pub --name docs-laptop
```

```text
OK Added SSH key docs-laptop (SHA256:5g5mDATXIDsUT/hhNWty4UwZHa24gLT8U4YyaENuOW0)
Connect with: stackblaze ssh --native
```

Without a file, it adds `~/.ssh/id_ed25519.pub` (or `id_ecdsa.pub`, `id_rsa.pub`), and `-` reads the key from stdin.
