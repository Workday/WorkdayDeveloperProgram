# Custom Agent template (ADK TypeScript)

## What it is

A complete Custom Agent built with the Google [Agent Development Kit](https://adk.dev) for TypeScript (`@google/adk` 2.5) and served over the [A2A protocol](https://a2a-protocol.org). Copy it to start your own agent. You need access to the Workday custom-agent Early Access program to deploy it.

The agent reaches Workday only through Workday Agent Harness: model inference, Workday tools (MCP), and session storage all go to Agent Harness with the credentials of the current turn. The instruction in `src/agent.ts` is a generic Workday assistant. The expenses sample is in `wd_agent_card.json`: one expenses skill and its tools. Change the instruction and the card to build your own agent.

## What's inside

- `src/index.ts`: the A2A server. Captures each turn's credentials and passes `HarnessSessionService` to `toA2a`.
- `src/agent.ts`: the `LlmAgent`, with its instruction and the Agent Harness MCP tools.
- `src/harness-llm.ts`: `HarnessLLM`, a `BaseLlm` that calls Agent Harness's OpenAI-compatible `/sandbox/v1/chat/completions`.
- `src/harness-mcp.ts`: the Workday tools, an `MCPToolset` over Agent Harness's `/sandbox/v1/mcp`.
- `src/turn-credentials.ts`: keeps this turn's `X-ACR-Token` and `wd-tenant` in `AsyncLocalStorage`.
- `src/harness-credentials.ts`: the Agent Harness URL and the credentials for every outbound call.
- `src/session/`: `HarnessSessionService` (sessions stored through Agent Harness's `/sandbox/v1/sessions`) and the `/dev/urandom` ID provider.
- `src/logger.ts`: verbose console logging. Only the token and the `authorization`/`cookie` headers are redacted; request and response bodies are logged truncated (see "Before you deploy").
- `src/**/*.test.ts`: unit tests (Node's built-in test runner). They make no network calls.
- `wd_agent_card.json`: the agent card you register.
- `appspec.yaml`: build and start commands for the platform.
- `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`: the Node project.

## How to use it

Node 22 is required. From this folder:

```bash
npm ci
npm run build
npm test
npm run dev      # runs src/index.ts with tsx on port 8080
```

### Store sessions through Agent Harness

A conversation can move to a new instance of the agent between turns, so the session cannot live only in memory. `HarnessSessionService` keeps the session in memory and writes every event through to Agent Harness; a new instance loads the session from Agent Harness. Create it and pass it to `toA2a` (`src/index.ts`):

```ts
const sessionService = new HarnessSessionService({
  // Missing credentials are not an error here: the session service logs
  // them and keeps the turn going.
  credentials: () => {
    try {
      return requireHarnessCredentials();
    } catch {
      return undefined;
    }
  },
  logger: ({ level, message, ...data }) => {
    const log = level === "error" ? logError : level === "warn" ? logWarn : logInfo;
    log("session", message, data);
  },
});

const a2aApp = await toA2a(rootAgent, {
  host: process.env.A2A_HOST ?? "0.0.0.0",
  port,
  authentication: captureTurnCredentials,
  sessionService,
  app,
});
```

If you build your own ADK `Runner` instead of using `toA2a`, pass the same `sessionService` to it.

### Install the /dev/urandom ID provider

An agent instance can start from a saved snapshot of an already-started process, so every instance starts with the same `Math.random` state. ADK's default event IDs come from `Math.random`. Without another ID provider, a new instance repeats event IDs, and Agent Harness can overwrite earlier events that have the same ID. Node's `crypto` does not fix this, because its generator state is also in the snapshot. `/dev/urandom` is reseeded by the kernel when the instance starts.

`src/session/urandom-uuid.ts` installs the provider with `setIdProvider`:

```ts
export function installUrandomIdProvider(uuid: () => string = urandomUuid): boolean {
  try {
    uuid();
  } catch {
    return false;
  }
  setIdProvider(uuid);
  return true;
}
```

The `HarnessSessionService` constructor calls it unless you pass `installIdProvider: false` (`src/session/harness-session-service.ts`):

```ts
    if ((options.installIdProvider ?? true) && !installUrandomIdProvider()) {
      this.log({ level: "error", message: "Cannot read /dev/urandom; id provider not set, so event ids can repeat on a new instance" });
    }
```

If you use a different session service, call `installUrandomIdProvider()` yourself at startup.

### Read the per-turn credentials

Agent Harness sends two headers on every A2A request: `X-ACR-Token` (this turn's token) and `wd-tenant`. The token changes every turn. `src/index.ts` reads them in the `authentication` callback of `toA2a`, the first per-request hook, and `src/turn-credentials.ts` keeps them in `AsyncLocalStorage` so the model call, the tools, and the session service can read them:

```ts
const captureTurnCredentials = async (req: { header(name: string): string | undefined }): Promise<User> => {
  const harnessToken = req.header(TOKEN_HEADER);
  const wdTenant = req.header(WD_TENANT_HEADER);
  setTurnCredentials({ harnessToken, wdTenant });
  logInfo("auth", "captured turn credentials from inbound A2A request", {
    wdTenant: wdTenant ?? "<absent>",
    harnessToken: redactSecret(harnessToken),
  });
  return new HarnessCredentialedUser(wdTenant ?? "unauthenticated");
};
```

The Agent Harness URL is fixed. It is `https://agent-harness.workday.com`, or `WORKDAY_AGENT_HARNESS_URL` if set, and it never comes from a request header: the agent sends its token to this address, so a caller must not be able to choose it. From `src/harness-credentials.ts`:

```ts
export function resolveHarnessUrl(): string {
  const configured = process.env.WORKDAY_AGENT_HARNESS_URL?.trim();
  const value = configured ? configured : DEFAULT_HARNESS_URL;
```

`WORKDAY_AGENT_HARNESS_URL` must be `https://`, except `localhost` or `127.0.0.1` for local testing.

### Call Workday tools through Agent Harness

ADK's `MCPToolset` takes a fixed URL and fixed headers when it is built. That does not work here, because the token changes every turn. `src/harness-mcp.ts` gives the toolset a custom `fetch` that sends each request to `<agent-harness>/sandbox/v1/mcp` with this turn's `x-acr-token` and `wd-tenant`:

```ts
export function harnessMcpFetch(fetchImpl: typeof fetch = fetch): typeof fetch {
  return (async (_input: string | URL | Request, init?: RequestInit) => {
    const { harnessToken, wdTenant, harnessUrl } = requireHarnessCredentials();
    const headers = new Headers(init?.headers);
    headers.set("x-acr-token", harnessToken);
    headers.set("wd-tenant", wdTenant);
    const url = `${harnessUrl}${MCP_PATH}`;
```

```ts
export function createHarnessMcpToolset(fetchImpl: typeof fetch = fetch): BaseToolset {
  return new OptionalToolset(
    new MCPToolset({
      type: "StreamableHTTPConnectionParams",
      url: PLACEHOLDER_URL,
      transportOptions: { fetch: harnessMcpFetch(fetchImpl) },
    }),
  );
}
```

`src/agent.ts` adds the toolset to the agent:

```ts
  tools: [createHarnessMcpToolset()],
```

`OptionalToolset` caches a successful tool list for 10 minutes and shares it across the turns of the same tenant (a turn for a different tenant lists again). When listing fails, the turn gets no tools instead of failing, and the failed list is kept only for that turn. Without a token (for example, when the process starts, before the first turn) it returns no tools and does not call Agent Harness.

Agent Harness returns the tools of the agent's active skills, as listed under `workdayConfig[].workdayResources` in `wd_agent_card.json`. List each tool there with its `agent_resource` id. Use one skill per agent during Early Access.

```json
  "workdayConfig": [
    {
      "skillId": "expenses",
      "executionMode": {
        "id": "d785eba56e9c100035d336a043ff0000"
      },
      "workdayResources": [
        {
          "tool_name": "find_expense_lines",
          "description": "Retrieves a single expense report line by WID.",
          "agent_resource": {
            "id": "8797ce815d30100021e9f9365c9a0000"
          }
        },
```

### Fill in the agent card

`wd_agent_card.json` describes the agent to Workday:

- `name`, `description`, `overview`: what users see. `overview` is the agent's short self-description.
- `url`: a placeholder (`https://example.com/agent/expenses`).
- `version`: your agent's version.
- `provider.id`, `platform.id`, `agentFramework.id`: Workday ids for the provider, platform, and agent framework. Keep them as they are; they are the same for every Early Access agent.
- `agentFrameworkVersion`: the framework version, `2.5.0` here. Keep it equal to the `@google/adk` version in `package.json`.
- `skills`: one skill (`id`, `name`, `description`).
- `workdayConfig`: per skill, the `executionMode` id (keep it as it is) and the `workdayResources` (tools), as above.

Get the WIDs of the Agent Ready Tools from the [MCP Explorer](https://developer.workday.com/mcp-explorer) or the Developer Agent Plugin.

### When Agent Harness is down

The turn continues, and errors are logged:

- Sessions: a create or append that fails with a network error, 408, 429, or 5xx, or that has no turn credentials, is logged and queued for that session. The queue is sent, in order, on the session's next event append that has credentials. Any other non-success status is logged and the operation is dropped, not retried. A failed read is logged, and the turn runs without the stored history.
- Tools: if the tool list fails, a warning is logged and the turn runs with no tools.

Model inference also goes through Agent Harness. If that call fails, `HarnessLLM` throws and the turn fails.

### Dependencies

`@modelcontextprotocol/sdk` is an optional peer dependency of `@google/adk` 2.5, so npm does not install it with ADK. `MCPToolset` needs it, so `package.json` lists it explicitly. Keep it there if you copy this agent:

```json
  "dependencies": {
    "@a2a-js/sdk": "^0.3.14",
    "@google/adk": "^2.5.0",
    "@modelcontextprotocol/sdk": "^1.30.0",
    "express": "^4.22.2"
  },
```

### Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `WORKDAY_AGENT_HARNESS_URL` | No | `https://agent-harness.workday.com` | Agent Harness base URL, no path. `https://` only, except `localhost` or `127.0.0.1` for local testing. |
| `WORKDAY_AGENT_HARNESS_MODEL` | No | `auto/auto` | Model id sent to Agent Harness. `auto/auto` lets the platform pick. |
| `PORT` | No | `8080` | Port for A2A and `/health`. |
| `A2A_HOST` | No | `0.0.0.0` | Host the A2A server binds and advertises. |

The token and the tenant are not environment variables. They come only from the `X-ACR-Token` and `wd-tenant` request headers; a turn without them fails.

### Test locally with a stub Agent Harness

Start a stub that answers chat completions:

```js
// fake-agent-harness.mjs
import { createServer } from "node:http";
createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ choices: [{ message: { content: "hello!" } }] }));
  });
}).listen(9999);
```

```bash
node fake-agent-harness.mjs &
WORKDAY_AGENT_HARNESS_URL=http://localhost:9999 npm run dev
```

Check the server, then send a message with both headers:

```bash
curl --fail http://localhost:8080/health
curl --fail http://localhost:8080/.well-known/agent-card.json

curl --fail http://localhost:8080/jsonrpc \
  -H "content-type: application/json" \
  -H "x-acr-token: test-token" \
  -H "wd-tenant: test-tenant" \
  -d '{"jsonrpc":"2.0","method":"message/send","params":{"message":{"kind":"message","messageId":"m1","role":"user","parts":[{"kind":"text","text":"Hi, who are you?"}]},"configuration":{"blocking":true}},"id":1}'
```

The stub sends the same chat reply to every path, so the session and MCP calls do not get the answers they expect. The agent logs them and still replies.

### Build and deploy to Workday

1. Check the build locally: run `npm install` (it creates or updates `package-lock.json`), then `npm ci` and `npm run build`. If any of these fails locally, the Workday build fails too.
2. Create the app with the Workday CLI: run `wdcli app create`, choose **Custom Agent (External Framework)**, and set the path to `.`. You can create the app only through the CLI.
3. Upload it: run `wdcli app upload`. The build takes 5 to 10 minutes. Wait for "Build succeeded". If the build fails, see the build logs on the developer site.
4. Install the app in your tenant's App Manager. On a development tenant, it is installed automatically. When you update an agent on an implementation tenant, configure it in App Manager and select "update agent".
5. In Agent Management Hub, assign security groups to each skill. The agent is then added to the Sana Principal Agent.
6. In Sana, ask the Sana Principal Agent to call your agent. For example: "Call my Expenses Agent to show my recent expense reports."

## Before you deploy

- **Agent instruction and description**: `src/agent.ts` holds a generic Workday assistant instruction. Replace it with your agent's.
- **Logging**: `src/index.ts`, `src/harness-llm.ts`, and `src/harness-mcp.ts` log request and response bodies (truncated), including prompts, model replies, and tool results, which can contain user data. Only the `X-ACR-Token` value and the `authorization`/`cookie` headers are redacted (`redactSecret` in `src/logger.ts`). Review and reduce this logging before production.
- **Agent card**: in `wd_agent_card.json`, change `name`, `description`, `overview`, `url`, `version`, and the skill to your agent's.
- **Tool ids**: `wd_agent_card.json` lists the sample's expenses tools under `workdayResources`. Keep the ones you use, remove the others, and add the WIDs of any other tools you need (see "Fill in the agent card" for where to get them).
- **Other card ids**: keep `provider.id`, `platform.id`, `agentFramework.id`, and `executionMode.id` in `wd_agent_card.json` as they are. They are the same for every Early Access agent.
- **Framework version**: if you change the `@google/adk` version in `package.json`, change `agentFrameworkVersion` in `wd_agent_card.json` to match.
- **Agent Harness URL**: `src/harness-credentials.ts` sets `DEFAULT_HARNESS_URL` to `https://agent-harness.workday.com`. Leave it unless the program gives you another address; for local testing, set `WORKDAY_AGENT_HARNESS_URL` instead of editing the code.
- **Package name**: `name` in `package.json` and `package-lock.json` is `expenses-google-adk-agent`. Rename it to your agent's.
