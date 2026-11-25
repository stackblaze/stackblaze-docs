Add the StackBlaze MCP server to Cursor. The `stackblaze` entry is merged into `~/.cursor/mcp.json` with your saved token, and other servers in the file are kept:

```sh
stackblaze setup mcp --ide cursor
```

```text
OK Configured stackblaze MCP for Cursor → /tmp/home/.cursor/mcp.json
HTTP transport: https://mcp-dev.stackblaze.cloud/mcp
```

`--print` shows the snippet instead of writing it, with a placeholder for the token:

```sh
stackblaze setup mcp --ide claude --print
```

```text
{
  "mcpServers": {
    "stackblaze": {
      "type": "http",
      "url": "https://mcp-dev.stackblaze.cloud/mcp",
      "headers": {
        "Authorization": "Bearer <STACKBLAZE_TOKEN>"
      }
    }
  }
}
# Claude Code: add this to /tmp/home/.claude.json
# Replace <STACKBLAZE_TOKEN> with an API token (create one: stackblaze tokens create claude-mcp).
```
