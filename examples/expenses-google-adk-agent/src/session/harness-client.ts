// This turn's credentials for Workday Agent Harness. Valid for one turn only.
export interface HarnessCredentials {
  harnessToken: string;
  wdTenant: string;
  // Base Agent Harness URL (see resolveHarnessUrl), trailing slashes removed.
  harnessUrl: string;
}

export const SESSIONS_PATH = "/sandbox/v1/sessions";

export interface HarnessResponse {
  status: number;
  json: unknown;
}

// One HTTP call to Workday Agent Harness. Throws on a network error or a timeout; any
// HTTP status is returned to the caller. The response body is never put in
// an error, so Agent Harness error text does not reach the agent's logs.
export async function callHarness(
  fetchImpl: typeof fetch,
  credentials: HarnessCredentials,
  timeoutMs: number,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<HarnessResponse> {
  const headers: Record<string, string> = {
    "x-acr-token": credentials.harnessToken,
    "wd-tenant": credentials.wdTenant,
  };
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await fetchImpl(credentials.harnessUrl + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  return { status: response.status, json };
}

// 408, 429 and 5xx can succeed later. Other 4xx statuses will fail again
// with the same request.
export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}
