Ship everything staged for the app as one release, with a message for the deployments timeline:

```sh
stackblaze pending apply -p github-demo-cw8z -e dev -a shop-web-xivg -m "Debug logging + checkout flag, 2 instances"
stackblaze pending list -p github-demo-cw8z -e dev -a shop-web-xivg
```

```text
OK Applied staged changes to github-demo-cw8z/dev/shop-web-xivg: LOG_LEVEL, FEATURE_CHECKOUT, scale:web
One release: rolling out (config revision cmww8b76s003rwn01mqkk57j2). Follow it with `stackblaze deployments`.
OK No staged changes for github-demo-cw8z/dev/shop-web-xivg
```
