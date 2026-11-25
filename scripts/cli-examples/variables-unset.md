Remove a variable. Type `yes` to confirm, or pass `-y`.

```sh
stackblaze variables unset FEATURE_SEARCH -p github-demo-cw8z -e dev -a hello-web
```

```text
!  This will DELETE 1 variable(s) from github-demo-cw8z/dev/hello-web-qw6y: FEATURE_SEARCH
Type "yes" to continue: yes
OK Updated github-demo-cw8z/dev/hello-web-qw6y: FEATURE_SEARCH
One release: rolling out (config revision cmww80vvi0036wn019c60smi2). Follow it with `stackblaze deployments`.
```
