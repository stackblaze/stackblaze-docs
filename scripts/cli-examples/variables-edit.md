Edit the app's variables in your editor. Here the editor changed `LOG_LEVEL`, deleted `CACHE_TTL` and added `MAINTENANCE`; after you save and quit, the CLI lists the changes and asks before it ships them as one release.

```sh
stackblaze variables edit -p github-demo-cw8z -e dev -a hello-web
```

```text
+ MAINTENANCE
~ LOG_LEVEL
- CACHE_TTL
Apply 3 change(s) to github-demo-cw8z/dev/hello-web-qw6y? Type "yes": yes
OK Updated github-demo-cw8z/dev/hello-web-qw6y: CACHE_TTL, MAINTENANCE, LOG_LEVEL
One release: rolling out (config revision cmww83ymj0065uz01q547qmmd). Follow it with `stackblaze deployments`.
```
