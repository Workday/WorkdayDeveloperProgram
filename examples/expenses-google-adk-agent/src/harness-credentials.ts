import { getTurnCredentials } from "./turn-credentials.js";

// Every agent calls Workday Agent Harness at this address by default. Override it with
// WORKDAY_AGENT_HARNESS_URL (e.g. to point at a local stub).
export const DEFAULT_HARNESS_URL = "https://agent-harness.workday.com";

// This turn's credentials for any outbound call to Workday Agent Harness.
// Inference (`HarnessLLM`) and MCP tools (`harness-mcp.ts`) throw when they are
// missing; sessions (`session/`, via index.ts) treat them as absent and log.
// The token and tenant come only from this turn's A2A request headers (see
// turn-credentials.ts). The Agent Harness URL is not per turn: see
// `resolveHarnessUrl`.
export interface HarnessCredentials {
  harnessToken: string;
  wdTenant: string;
  // Base Agent Harness host, trailing slashes removed.
  harnessUrl: string;
}

// Where to call Workday Agent Harness: `WORKDAY_AGENT_HARNESS_URL`, defaulting to the public name above.
//
// Deliberately not taken from the inbound request. This agent sends its
// token to this address, so a caller-supplied header must not be able to
// choose it.
//
// https only, except a loopback address so a local fake Agent Harness can be used.
export function resolveHarnessUrl(): string {
  const configured = process.env.WORKDAY_AGENT_HARNESS_URL?.trim();
  const value = configured ? configured : DEFAULT_HARNESS_URL;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`WORKDAY_AGENT_HARNESS_URL is not a valid URL: ${value}`);
  }
  const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) {
    throw new Error(`WORKDAY_AGENT_HARNESS_URL must be https (http is allowed only for localhost or 127.0.0.1): ${value}`);
  }
  return value.replace(/\/+$/, "");
}

export function requireHarnessCredentials(): HarnessCredentials {
  const turnCredentials = getTurnCredentials();
  const harnessToken = turnCredentials?.harnessToken;
  if (!harnessToken) {
    throw new Error(
      "X-ACR-Token is not available -- this turn's invoke call must carry it " +
        "as the X-ACR-Token header.",
    );
  }
  const wdTenant = turnCredentials?.wdTenant;
  if (!wdTenant) {
    throw new Error(
      "wd-tenant is not available -- Workday Agent Harness is multi-tenant and requires the " +
        "caller's tenant on every request, as this turn's wd-tenant header.",
    );
  }
  return { harnessToken, wdTenant, harnessUrl: resolveHarnessUrl() };
}
