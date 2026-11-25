Remove the saved credentials from this machine. The token itself stays valid until you revoke it (`stackblaze tokens revoke`):

```sh
stackblaze logout
stackblaze whoami
```

```text
OK Logged out — removed local credentials.
x  No API token. Pass --token, set STACKBLAZE_TOKEN, or run `stackblaze login`. Create a token in the dashboard under Settings > API tokens (sb_pat_...).
```
