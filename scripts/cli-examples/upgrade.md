Update the CLI to the latest stable release. It replaces the binary you ran:

```sh
stackblaze upgrade
```

```text
Target: /tmp/home/bin/stackblaze
OK Already up to date (v1.1.21, latest stable release).
Pass --version 1.1.21 to install that release anyway.
```

Install one release, to another path:

```sh
stackblaze upgrade --version 1.1.21 --install-path /tmp/home/bin/stackblaze
```

```text
Target: /tmp/home/bin/stackblaze
OK Upgraded /tmp/home/bin/stackblaze
Version: 1.1.21
```
