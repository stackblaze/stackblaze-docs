Remove a log drain. Type `yes` to confirm (or pass `-y`). The app rolls out without it:

```sh
stackblaze log-drains remove errors -p github-demo-cw8z -e dev -a shop-web-xivg
```

```text
!  Removing log drain errors from github-demo-cw8z/dev/shop-web-xivg: its logs stop shipping there.
Type "yes" to continue: yes
OK Removed log drain errors from github-demo-cw8z/dev/shop-web-xivg
```
