# Workday MCP Agent-Ready Tools

## What it is

A reference implementation and specification of Model Context Protocol (MCP) Agent-Ready Tools for Workday. It provides standardized, flattened JSON-RPC 2.0 tool definitions and a lightweight stdio server that enables AI agents (such as Claude Code, Cursor, and enterprise LLM assistants) to interact safely and efficiently with Workday HCM and Financials data.

Unlike raw REST endpoints that return deeply nested HATEOAS structures and consume thousands of context tokens, Workday Agent-Ready Tools flatten payloads into concise, self-describing schemas. This reduces model context consumption by up to 70%, minimizes hallucination, and enforces strict Agent System of Record (ASOR) security guardrails.

## What's inside

- `schemas/`: Self-describing JSON Schema tool definitions following the Model Context Protocol:
  - `get_worker_profile.json`: Retrieves flattened worker identity, job profile, supervisory organization, and location.
  - `query_wql_readonly.json`: Executes read-only WQL SELECT queries against authorized tenant data sources.
  - `get_inbox_tasks.json`: Retrieves active awaiting-action inbox tasks and approvals.
  - `get_time_off_balance.json`: Retrieves real-time time off balances across eligible plans.
  - `get_supplier_invoice_summary.json`: Queries supplier invoices, payment schedules, and hold reasons with automatic masking of banking details.
- `server/mcp-server.mjs`: A lightweight, zero-dependency Node.js MCP server implementing JSON-RPC 2.0 over standard I/O (`tools/list` and `tools/call`).
- `sample-interactions/sample-mcp-session.json`: Complete session trace demonstrating handshake, tool discovery, and execution.
- `example.json`: Metadata file used by the Workday Developer Program gallery and validation tooling.

## How to use it

### 1. Test in Sandbox Mode (Zero Setup)

You can run the MCP server immediately without tenant credentials to inspect tool listings and test simulated agent interactions:

```bash
node examples/workday-mcp-agent-tools/server/mcp-server.mjs
```

### 2. Configure with Live Workday Tenant

Set the environment variables for your Workday integration account or OAuth 2.0 API client:

```bash
export WORKDAY_HOST="your-tenant-host.workday.com"
export WORKDAY_TENANT="your_tenant_id"
export WORKDAY_TOKEN="your_bearer_token"
```

### 3. Connect to Claude Desktop or Claude Code

Add the server to your MCP configuration file (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "workday": {
      "command": "node",
      "args": [
        "/absolute/path/to/WorkdayDeveloperProgram/examples/workday-mcp-agent-tools/server/mcp-server.mjs"
      ],
      "env": {
        "WORKDAY_HOST": "your-tenant-host.workday.com",
        "WORKDAY_TENANT": "your_tenant_id",
        "WORKDAY_TOKEN": "your_bearer_token"
      }
    }
  }
}
```

Once loaded, your AI assistant can discover tools and answer questions such as:
- *"Who reports to Alex Morgan?"*
- *"Do I have any pending approval tasks in my Workday inbox?"*
- *"What is my remaining vacation balance as of today?"*

## Before you deploy

- **Security domains**: Every tool inherits the caller's Workday security profile. Ensure the integration account has permissions for `Worker Data: Public`, `Worker Data: Core Personal`, `View: Supplier Invoice`, and `Self-Service: Time Off and Leave`.
- **Read-only by default**: The reference tools are strictly read-only. For any write operation (such as submitting an expense report or requesting leave), the tool should generate a proposal card requiring human-in-the-loop approval.
- **WQL query guardrails**: The `query_wql_readonly` tool enforces that queries start with `SELECT` and restricts result sets to prevent data dumps.
- **Sensitive data masking**: Financial tools explicitly mask or omit bank account routing, account numbers, and tax identification numbers before returning data to the language model.
- **Tenant credentials**: Never commit API keys, OAuth tokens, or client secrets. Always inject credentials through environment variables or secure key vaults.
