Detach a database from the `whiteboard` app and delete it with its data. `--destroy` asks you to type the add-on's name:

```sh
stackblaze addons delete --instance whiteboard-8stj-postgresql-restored-76yo --destroy -p github-demo-cw8z -e dev -a whiteboard
```

```text
!  This detaches whiteboard-8stj-postgresql-restored-76yo from github-demo-cw8z/dev/whiteboard-8stj and then DELETES the shared add-on and ALL ITS DATA (refused while another app still uses it). This cannot be undone.
Type the add-on name (whiteboard-8stj-postgresql-restored-76yo) to confirm: 
OK Detached addon whiteboard-8stj-postgresql-restored-76yo from github-demo-cw8z/dev/whiteboard-8stj
OK Deleted add-on whiteboard-8stj-postgresql-restored-76yo and its data from github-demo-cw8z/dev
```

A database no app uses any more needs no `-a`. In a script, `--yes` skips the prompt:

```sh
stackblaze addons delete --instance whiteboard-8stj-postgresql-restored-fob8 --destroy -p github-demo-cw8z -e dev --yes
```

```text
!  This DELETES the shared add-on whiteboard-8stj-postgresql-restored-fob8 (PostgreSQL) in github-demo-cw8z/dev and ALL ITS DATA (refused while an app still uses it). This cannot be undone.
OK Deleted add-on whiteboard-8stj-postgresql-restored-fob8 and its data from github-demo-cw8z/dev
```
