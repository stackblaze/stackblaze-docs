Delete a file on the app's volume. Type `yes` to confirm, or pass `-y`.

```sh
stackblaze files delete /data/uploads/imports/customers-2026-11.csv -p github-demo-cw8z -e dev -a hello-web
stackblaze files list /data/uploads/imports -p github-demo-cw8z -e dev -a hello-web
```

```text
!  Delete /data/uploads/imports/customers-2026-11.csv on github-demo-cw8z/dev/hello-web-qw6y?
Type "yes" to continue: yes
OK Deleted /data/uploads/imports/customers-2026-11.csv
/data/uploads/imports  pod=hello-web-qw6y-web-59c674b9c6-f8jsk
(empty)
```
