Set two variables in one release, with a message for the deployments timeline.

```sh
stackblaze variables set LOG_LEVEL=debug FEATURE_SEARCH=on -p github-demo-cw8z -e dev -a hello-web -m "Turn on search"
```

```text
OK Updated github-demo-cw8z/dev/hello-web-qw6y: LOG_LEVEL, FEATURE_SEARCH
One release: rolling out (config revision cmww804df0033wn01o5acjwh4). Follow it with `stackblaze deployments`.
```

To keep a secret out of your shell history, pipe it in: `printf %s "$SECRET" | stackblaze variables set API_KEY --stdin`.
