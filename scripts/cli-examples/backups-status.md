Follow a restore. While it runs:

```sh
stackblaze backups status -p github-demo-cw8z -e dev
```

```text
OK Copy b55c0774-27d9-4e7f-b893-c73d874d7282 from manual-github-demo-cw8z-dev-1795617417246: Copying
  dumps    running
  volumes  pending
  whiteboard-8stj-postgresql-6bt2 → whiteboard-8stj-postgresql-restored-z27r
```

When a restore has finished, the last line names the new database:

```text
OK Copy 0465f4c7-bd44-407c-b873-6eb59c30c738 from manual-github-demo-cw8z-dev-1795617417246: Succeeded
  dumps    done
  volumes  skipped
  whiteboard-8stj-postgresql-6bt2 → whiteboard-8stj-postgresql-restored-nev0
```

With no restore running or ended in the last 10 minutes:

```text
OK No restore running in github-demo-gv35/dev (none ended in the last 10 minutes)
```
