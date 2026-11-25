import { AsyncLocalStorage } from "node:async_hooks";

// Per-turn X-ACR-Token/wd-tenant, threaded from the inbound A2A HTTP
// request through to every outbound call to Workday Agent Harness: inference
// (HarnessLLM), MCP tools (harness-mcp.ts) and sessions (session/).
//
// Workday Agent Harness sends both required auth headers to the agent's
// endpoint -- i.e. on the A2A request itself. ADK's
// `BaseLlm.generateContentAsync()` only receives an `LlmRequest`, with
// no path back to the original inbound HTTP request or its headers -- so
// there's no way to hand it this turn's credentials as a plain function
// argument without changing ADK/`toA2a()` itself. `AsyncLocalStorage` is the
// standard Node mechanism for exactly this shape of problem: request-scoped
// state that needs to reach deeply-nested async code without threading it
// through every intermediate call signature, and (unlike a module-level
// mutable variable) it stays correctly isolated per concurrent request.
//
// Populated once per request by the custom `UserBuilder` in `index.ts` (the
// earliest per-request hook `toA2a()`/`@a2a-js/sdk` exposes), via
// `enterWith()` rather than `run()`: `run()` only propagates its store to
// async operations created *within* its own callback, but `UserBuilder`'s
// caller (a2a-js's own request handling) continues the rest of this
// request's work *after* `UserBuilder` returns, not inside it --
// `enterWith()` is the API built for exactly that "rest of this request's
// continuation" case.
export interface TurnCredentials {
  // Both fields are independently optional: each is captured whenever its
  // header is present (see index.ts's captureTurnCredentials); the read site
  // errors if either is missing. The Agent Harness URL is not a turn credential; see
  // harness-credentials.ts.
  harnessToken?: string;
  wdTenant?: string;
}

const storage = new AsyncLocalStorage<TurnCredentials>();

export function setTurnCredentials(credentials: TurnCredentials): void {
  storage.enterWith(credentials);
}

export function getTurnCredentials(): TurnCredentials | undefined {
  return storage.getStore();
}

// For the tests: `storage.run()` (unlike `enterWith()`) scopes the store to
// exactly the given callback's own continuation, so tests get clean
// isolation from each other without needing an explicit "clear" API.
export function withTurnCredentials<T>(credentials: TurnCredentials, fn: () => T): T {
  return storage.run(credentials, fn);
}
