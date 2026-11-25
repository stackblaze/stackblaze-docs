Remove the registry login. The CLI asks first:

```sh
stackblaze registry logout
stackblaze registry status
```

```text
Remove the registry login for registry.example.com? Private images from it stop pulling. [y/N]: y
OK Removed the registry login for registry.example.com
No registry login. Public images pull without one. Add one: stackblaze registry login <host> -u <user>
```
