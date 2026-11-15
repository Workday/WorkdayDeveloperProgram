#!/usr/bin/env node
/**
 * Workday Model Context Protocol (MCP) Agent-Ready Tools Server
 *
 * Implements a standard JSON-RPC 2.0 stdio transport adhering to the Model
 * Context Protocol (MCP) specification (2024-11-05). Exposes flattened,
 * self-describing Agent-Ready Tools for Workday HCM and Financials.
 */

import { createInterface } from "node:readline";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = join(__dirname, "..", "schemas");

// Configuration from environment variables
const WORKDAY_HOST = process.env.WORKDAY_HOST || "";
const WORKDAY_TENANT = process.env.WORKDAY_TENANT || "";
const WORKDAY_TOKEN = process.env.WORKDAY_TOKEN || "";

// Load tool definitions from schemas directory
function loadTools() {
  const tools = [];
  if (!existsSync(SCHEMAS_DIR)) return tools;

  const files = readdirSync(SCHEMAS_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    try {
      const content = JSON.parse(readFileSync(join(SCHEMAS_DIR, file), "utf8"));
      tools.push({
        name: content.name,
        description: content.description,
        inputSchema: content.parameters,
      });
    } catch (err) {
      process.stderr.write(`[Workday MCP] Error loading schema ${file}: ${err.message}\n`);
    }
  }
  return tools;
}

const TOOLS = loadTools();

// Send JSON-RPC response over stdout
function sendResponse(id, result, error = null) {
  const payload = { jsonrpc: "2.0", id };
  if (error) {
    payload.error = error;
  } else {
    payload.result = result;
  }
  process.stdout.write(JSON.stringify(payload) + "\n");
}

// Tool handlers: live Workday execution or sandbox responses
async function handleToolCall(name, args) {
  switch (name) {
    case "get_worker_profile": {
      const workerId = args.worker_id;
      if (!workerId) throw new Error("worker_id parameter is required");

      if (WORKDAY_HOST && WORKDAY_TOKEN && WORKDAY_TENANT) {
        const url = `https://${WORKDAY_HOST}/ccx/api/v1/${WORKDAY_TENANT}/workers/${encodeURIComponent(workerId)}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${WORKDAY_TOKEN}`, Accept: "application/json" }
        });
        if (!res.ok) throw new Error(`Workday API returned ${res.status}: ${res.statusText}`);
        const data = await res.json();
        // Flatten payload for agent efficiency
        return {
          worker_id: data.id || workerId,
          name: data.descriptor || data.primaryName || "Unknown",
          business_title: data.businessTitle || "Worker",
          supervisory_organization: data.supervisoryOrganization?.descriptor || "Unassigned",
          primary_email: data.primaryWorkEmail || "redacted@example.com",
          hire_date: data.hireDate || "2024-01-15",
          location: data.location?.descriptor || "Corporate Headquarters"
        };
      }

      // Sandbox fallback response
      return {
        _mode: "sandbox",
        worker_id: workerId,
        name: "Alex Morgan",
        business_title: "Senior Product Manager",
        supervisory_organization: "Digital Workplace Technologies",
        primary_email: "alex.morgan@example.com",
        hire_date: "2022-03-01",
        location: "San Francisco - Main Campus"
      };
    }

    case "query_wql_readonly": {
      const query = args.query;
      const limit = args.limit || 50;
      if (!query) throw new Error("query parameter is required");

      // Guardrail: must be SELECT only
      if (!query.trim().toUpperCase().startsWith("SELECT")) {
        throw new Error("Security Guardrail: Only SELECT queries are permitted in read-only WQL.");
      }

      if (WORKDAY_HOST && WORKDAY_TOKEN && WORKDAY_TENANT) {
        const url = `https://${WORKDAY_HOST}/ccx/api/wql/v1/${WORKDAY_TENANT}/data`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WORKDAY_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({ query: `${query} LIMIT ${limit}` })
        });
        if (!res.ok) throw new Error(`Workday WQL returned ${res.status}: ${res.statusText}`);
        const data = await res.json();
        return {
          row_count: data.data?.length || 0,
          rows: data.data || []
        };
      }

      // Sandbox fallback response
      return {
        _mode: "sandbox",
        query_executed: query,
        row_count: 2,
        rows: [
          { worker: "WID_101", legalName: "Morgan, Alex", primaryWorkEmail: "alex.morgan@example.com" },
          { worker: "WID_102", legalName: "Chen, David", primaryWorkEmail: "david.chen@example.com" }
        ]
      };
    }

    case "get_inbox_tasks": {
      const status = args.status || "Awaiting_Action";
      return {
        _mode: "sandbox",
        status_filter: status,
        task_count: 2,
        tasks: [
          {
            task_id: "INBOX-901",
            title: "Approve Time Off Request: David Chen (2 Days Vacation)",
            business_process: "Time Off Event",
            initiator: "David Chen",
            due_date: "2026-11-20"
          },
          {
            task_id: "INBOX-902",
            title: "Review Expense Report: Alex Morgan (Travel Expenses)",
            business_process: "Expense Report Event",
            initiator: "Alex Morgan",
            due_date: "2026-11-22"
          }
        ]
      };
    }

    case "get_time_off_balance": {
      return {
        _mode: "sandbox",
        worker_id: args.worker_id || "CURRENT_USER",
        effective_date: args.effective_date || "2026-11-15",
        plans: [
          { plan: "Paid Time Off (Vacation)", balance: 112.5, unit: "Hours" },
          { plan: "Sick Leave", balance: 48.0, unit: "Hours" },
          { plan: "Floating Holiday", balance: 1.0, unit: "Days" }
        ]
      };
    }

    case "get_supplier_invoice_summary": {
      return {
        _mode: "sandbox",
        invoice_number: args.invoice_number || "INV-88492",
        supplier: "Acme Office Supplies Inc.",
        invoice_date: "2026-10-15",
        due_date: "2026-11-14",
        total_amount: 4250.00,
        currency: "USD",
        invoice_status: "Approved",
        payment_status: "Scheduled for 2026-11-20",
        hold_reason: null,
        notes: "3-way match verified against PO-44102."
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// JSON-RPC 2.0 Dispatcher
async function handleMessage(raw) {
  if (!raw.trim()) return;

  let request;
  try {
    request = JSON.parse(raw);
  } catch (err) {
    sendResponse(null, null, { code: -32700, message: "Parse error" });
    return;
  }

  const { id, method, params } = request;

  try {
    switch (method) {
      case "initialize":
        sendResponse(id, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: {
            name: "workday-mcp-agent-tools",
            version: "1.0.0",
          },
        });
        break;

      case "notifications/initialized":
        // Client confirmed initialization. No response needed for notifications.
        break;

      case "tools/list":
        sendResponse(id, { tools: TOOLS });
        break;

      case "tools/call": {
        if (!params || !params.name) {
          sendResponse(id, null, { code: -32602, message: "Missing tool name in params" });
          return;
        }
        const result = await handleToolCall(params.name, params.arguments || {});
        sendResponse(id, {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        });
        break;
      }

      default:
        if (id !== undefined) {
          sendResponse(id, null, { code: -32601, message: `Method not found: ${method}` });
        }
        break;
    }
  } catch (err) {
    if (id !== undefined) {
      sendResponse(id, null, { code: -32603, message: err.message });
    }
  }
}

// Standard I/O interface
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false });
rl.on("line", handleMessage);

