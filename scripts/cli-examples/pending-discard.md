Drop a staged change you no longer want. Type `yes` to confirm (or pass `-y`):

```sh
stackblaze variables set LOG_LEVEL=trace --skip-deploy -p github-demo-cw8z -e dev -a shop-web-xivg
stackblaze pending discard -p github-demo-cw8z -e dev -a shop-web-xivg
```

```text
OK Staged 1 change(s) for github-demo-cw8z/dev/shop-web-xivg: LOG_LEVEL
1 change(s) pending. Apply them as one release with `stackblaze pending apply` (or `stackblaze deploy --apply-pending`); drop them with `stackblaze pending discard`.
!  This will DISCARD every change staged for github-demo-cw8z/dev/shop-web-xivg.
Type "yes" to continue: yes
OK Discarded 1 staged change(s) for github-demo-cw8z/dev/shop-web-xivg
```
