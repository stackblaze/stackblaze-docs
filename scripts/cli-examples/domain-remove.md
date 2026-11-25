Remove a custom domain from an app. Type `yes` to confirm, or pass `-y`.

```sh
stackblaze domain remove shop.example.com -p github-demo-cw8z -e dev -a hello-site
```

```text
!  Removing shop.example.com from github-demo-cw8z/dev/hello-web-qw6y detaches it from the app and stops serving HTTPS for it; visitors using it will get errors until it is added again.
Type "yes" to continue: yes
OK Removed domain shop.example.com from github-demo-cw8z/dev/hello-web-qw6y
```
