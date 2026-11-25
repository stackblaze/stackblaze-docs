Pause an app you don't need for a while, with a reason for the deployment history. Its pods stop and compute stops billing; type `yes` to confirm (or pass `-y`):

```sh
stackblaze down -p github-demo-cw8z -e dev -a shop-web-xivg -m 'Paused over the weekend'
```

```text
!  This will pause github-demo-cw8z/dev/shop-web on https://api-dev.stackblaze.cloud: all its pods stop until you run `stackblaze resume`. Volumes and add-ons keep running.
Type "yes" to continue: yes
OK Paused github-demo-cw8z/dev/shop-web-xivg
All pods stopped; volumes and add-ons keep running. Run `stackblaze resume` to start it again.
```

Visitors to the app's URL now get a page titled **Paused**. `stackblaze resume` starts it again.
