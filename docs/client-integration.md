# AI Client Integration Guide — fatturafacile-mcp-server

`fatturafacile-mcp-server` supports all Model Context Protocol (MCP) compliant clients and agent orchestration frameworks.

---

## 1. Claude Desktop

Edit your `claude_desktop_config.json`:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "fattura-facile": {
      "command": "node",
      "args": ["C:/dev/fattura-facile/mcp-server/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "FATTURA_FACILE_API_URL": "https://api.fatturafacile.eu",
        "FATTURA_FACILE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

---

## 2. Claude Code (CLI)

Claude Code detects MCP servers declared in the project's root or `.claude/settings.json`:

```bash
# Add the local MCP server to Claude Code
claude mcp add fattura-facile node C:/dev/fattura-facile/mcp-server/dist/index.js
```

---

## 3. Cursor IDE

Configure `.cursor/mcp.json` in your workspace root:

```json
{
  "mcpServers": {
    "fattura-facile": {
      "command": "node",
      "args": ["C:/dev/fattura-facile/mcp-server/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

---

## 4. Windsurf IDE

In your Windsurf configuration (`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "fattura-facile": {
      "command": "node",
      "args": ["C:/dev/fattura-facile/mcp-server/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

---

## 5. VS Code (via Continue or Official MCP Extensions)

In `.vscode/mcp.json` or Continue configuration:

```json
{
  "mcpServers": {
    "fattura-facile": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"]
    }
  }
}
```

---

## 6. Microsoft Copilot, ChatGPT & OpenAI Agents SDK (HTTP/SSE)

Run the server with Streamable HTTP or SSE transport enabled:

```bash
MCP_TRANSPORT=streamable-http PORT=3000 pnpm start
```

### Endpoints:

- **SSE Stream:** `http://localhost:3000/sse`
- **JSON-RPC Messages:** `http://localhost:3000/messages`
- **Health Check:** `http://localhost:3000/health`

### Python OpenAI Agents SDK Example:

```python
from mcp.client.sse import sse_client
from openai import OpenAI

# Connect to fatturafacile-mcp-server over SSE
async with sse_client("http://localhost:3000/sse") as (read_stream, write_stream):
    # Pass streams to the MCP client session
    ...
```

---

## 7. Semantic Kernel & LangChain

Both frameworks can connect to `fatturafacile-mcp-server` using the standard TypeScript/Python MCP SDK client wrappers:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/index.js'],
});

const client = new Client({ name: 'langchain-agent', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);

const tools = await client.listTools();
console.log('Available Fattura Facile tools:', tools);
```
