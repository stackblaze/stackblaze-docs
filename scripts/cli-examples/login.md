Sign in on a machine without a browser, such as a CI runner, with an API token:

```sh
stackblaze login --token "$TOKEN"
```

```text
OK Logged in to https://api-dev.stackblaze.cloud
projects: 13
Infrastructure as Code: status unavailable (API reachable)
credentials saved to /tmp/ci/.config/stackblaze/config.json (treat as a secret)
```

Over SSH, `--browserless` prints the sign-in link instead of opening a browser. Open it on any device where you're signed in to the dashboard and choose **Approve**:

```sh
stackblaze login --browserless
```

```text
  → Sign in with one click:
    https://dashboard-dev.stackblaze.com/activate?user_code=VQWC-RTPE

  → Or go to https://dashboard-dev.stackblaze.com/activate and enter this code:
    VQWC-RTPE

Waiting for sign-in...
OK Logged in to https://api-dev.stackblaze.cloud
projects: 13
Infrastructure as Code: status unavailable (API reachable)
credentials saved to /tmp/home/.config/stackblaze/config.json (treat as a secret)
```
