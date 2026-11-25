Save the login every app in the organization uses to pull private images from your registry. Read the password or access token from a file or stdin, so it never lands in shell history:

```sh
stackblaze registry login registry.example.com -u docs-demo --password-stdin < token.txt
```

```text
OK Saved the registry login for registry.example.com (user docs-demo). Apps pull with it from their next start.
```
