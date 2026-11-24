import {
  BaseSessionService,
  createSession,
  newId,
  type AppendEventRequest,
  type CreateSessionRequest,
  type Event,
  type GetSessionConfig,
  type GetSessionRequest,
  type ListSessionsResponse,
  type Session,
} from "@google/adk";
import { callHarness, isRetryableStatus, SESSIONS_PATH, type HarnessCredentials } from "./harness-client.js";
import { installUrandomIdProvider } from "./urandom-uuid.js";

export type { HarnessCredentials } from "./harness-client.js";

export interface SessionLogEntry {
  level: "error" | "warn" | "info";
  message: string;
  operation?: "createSession" | "getSession" | "appendEvent";
  sessionId?: string;
  status?: number;
  error?: string;
  queued?: number;
}

export interface HarnessSessionServiceOptions {
  // This turn's credentials, or undefined if the turn has none.
  credentials: () => HarnessCredentials | undefined;
  fetch?: typeof fetch;
  timeoutMs?: number;
  // Per session. When the queue is full, the oldest event is dropped; a
  // queued create is kept, because the events after it need it.
  maxPendingOperations?: number;
  logger?: (entry: SessionLogEntry) => void;
  // Set ADK's id provider to /dev/urandom UUIDs (see urandom-uuid.ts).
  // Default true. Without it, event ids repeat on each new instance.
  installIdProvider?: boolean;
}

type PendingOperation =
  | { kind: "create"; body: CreateBody }
  | { kind: "event"; session: Session; event: Event };

interface CreateBody {
  sessionId: string;
  appName: string;
  userId: string;
  state: Record<string, unknown>;
}

type Outcome = "done" | "retry" | "dropped";

function defaultLogger(entry: SessionLogEntry): void {
  const line = JSON.stringify({ time: new Date().toISOString(), component: "harness-adk-session", ...entry });
  if (entry.level === "error") console.error(line);
  else if (entry.level === "warn") console.warn(line);
  else console.log(line);
}

function errorText(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function filterEvents(session: Session, config: GetSessionConfig): Session {
  let events = session.events;
  if (config.numRecentEvents) events = events.slice(-config.numRecentEvents);
  if (config.afterTimestamp) {
    const after = config.afterTimestamp;
    events = events.filter((event) => event.timestamp >= after);
  }
  return { ...session, events };
}

// An ADK session service that keeps sessions in memory and writes every
// event through to Workday Agent Harness (`/sandbox/v1/sessions`). A new instance
// starts with an empty memory and loads the session from Agent Harness.
//
// A failed Agent Harness call never fails the turn. This service logs it. A
// create or append that fails with a network error, 408, 429 or 5xx, or has no
// turn credentials, waits in a per-session queue; any other non-success status
// is dropped. Later operations for that session queue behind it, because the
// Agent Harness applies state deltas in arrival order. The queue is sent, in
// order, on the session's next event append that has credentials.
export class HarnessSessionService extends BaseSessionService {
  private readonly cache = new Map<string, Session>();
  private readonly pending = new Map<string, PendingOperation[]>();
  private readonly locks = new Map<string, Promise<void>>();
  private readonly credentials: () => HarnessCredentials | undefined;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxPendingOperations: number;
  private readonly log: (entry: SessionLogEntry) => void;

  constructor(options: HarnessSessionServiceOptions) {
    super();
    this.credentials = options.credentials;
    this.fetchImpl = options.fetch ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.maxPendingOperations = Math.max(1, options.maxPendingOperations ?? 1000);
    this.log = options.logger ?? defaultLogger;
    if ((options.installIdProvider ?? true) && !installUrandomIdProvider()) {
      this.log({ level: "error", message: "Cannot read /dev/urandom; id provider not set, so event ids can repeat on a new instance" });
    }
  }

  async createSession({ appName, userId, state, sessionId }: CreateSessionRequest): Promise<Session> {
    const id = sessionId ?? newId();
    const body: CreateBody = { sessionId: id, appName, userId, state: state ?? {} };
    return this.serialize(id, async () => {
      const credentials = this.credentials();
      let session: Session | undefined;
      if (!credentials) {
        this.log({ level: "error", message: "No turn credentials; session create queued", operation: "createSession", sessionId: id });
        this.enqueue(id, { kind: "create", body });
      } else {
        try {
          const response = await callHarness(this.fetchImpl, credentials, this.timeoutMs, "POST", SESSIONS_PATH, body);
          if (response.status === 201) {
            session = this.toSession(response.json, id);
          } else if (response.status === 409) {
            session = await this.load(id, credentials);
            if (!session) {
              this.log({ level: "warn", message: "Session exists but could not be loaded; continuing with an empty session", operation: "createSession", sessionId: id });
            }
          } else if (isRetryableStatus(response.status)) {
            this.log({ level: "error", message: "Agent Harness rejected session create; queued", operation: "createSession", sessionId: id, status: response.status });
            this.enqueue(id, { kind: "create", body });
          } else {
            this.log({ level: "error", message: "Agent Harness rejected session create; not retried", operation: "createSession", sessionId: id, status: response.status });
          }
        } catch (error) {
          this.log({ level: "error", message: "Agent Harness call failed; session create queued", operation: "createSession", sessionId: id, error: errorText(error) });
          this.enqueue(id, { kind: "create", body });
        }
      }
      session ??= createSession({ id, appName, userId, state: { ...body.state }, events: [], lastUpdateTime: Date.now() });
      this.cache.set(id, session);
      return session;
    });
  }

  // ADK appends to the returned object, so a full session comes back as the
  // cached object itself. A filtered request gets a copy.
  async getSession({ sessionId, config }: GetSessionRequest): Promise<Session | undefined> {
    const cached = this.cache.get(sessionId);
    if (cached) return config ? filterEvents(cached, config) : cached;
    return this.serialize(sessionId, async () => {
      const loaded = this.cache.get(sessionId);
      if (loaded) return config ? filterEvents(loaded, config) : loaded;
      const credentials = this.credentials();
      if (!credentials) {
        this.log({ level: "error", message: "No turn credentials; session not loaded", operation: "getSession", sessionId });
        return undefined;
      }
      const session = await this.load(sessionId, credentials, config);
      if (session && !config) this.cache.set(sessionId, session);
      return session;
    });
  }

  async appendEvent({ session, event }: AppendEventRequest): Promise<Event> {
    const appended = await super.appendEvent({ session, event });
    if (appended.partial) return appended;
    await this.serialize(session.id, async () => {
      if (!this.cache.has(session.id)) this.cache.set(session.id, session);
      this.enqueue(session.id, { kind: "event", session, event: appended });
      await this.flush(session.id);
    });
    return appended;
  }

  async listSessions(): Promise<ListSessionsResponse> {
    throw new Error("listSessions is not supported by HarnessSessionService");
  }

  async deleteSession(): Promise<void> {
    throw new Error("deleteSession is not supported by HarnessSessionService");
  }

  private async load(sessionId: string, credentials: HarnessCredentials, config?: GetSessionConfig): Promise<Session | undefined> {
    const query = new URLSearchParams();
    if (config?.numRecentEvents) query.set("numRecentEvents", String(config.numRecentEvents));
    if (config?.afterTimestamp) query.set("afterTimestamp", String(config.afterTimestamp));
    const path = query.size ? `${SESSIONS_PATH}?${query}` : SESSIONS_PATH;
    try {
      const response = await callHarness(this.fetchImpl, credentials, this.timeoutMs, "GET", path);
      if (response.status === 404) return undefined;
      if (response.status !== 200) {
        this.log({ level: "error", message: "Agent Harness rejected session read", operation: "getSession", sessionId, status: response.status });
        return undefined;
      }
      // Agent Harness returns the session for this turn.
      const json = response.json as { id?: unknown } | undefined;
      if (json?.id !== sessionId) return undefined;
      return this.toSession(json, sessionId);
    } catch (error) {
      this.log({ level: "error", message: "Agent Harness call failed; session not loaded", operation: "getSession", sessionId, error: errorText(error) });
      return undefined;
    }
  }

  private toSession(json: unknown, id: string): Session {
    const value = (json ?? {}) as Partial<Session>;
    return createSession({
      id,
      appName: value.appName ?? "",
      userId: value.userId ?? "",
      state: value.state ?? {},
      events: value.events ?? [],
      lastUpdateTime: value.lastUpdateTime ?? Date.now(),
    });
  }

  private enqueue(sessionId: string, operation: PendingOperation): void {
    let queue = this.pending.get(sessionId);
    if (!queue) {
      queue = [];
      this.pending.set(sessionId, queue);
    }
    queue.push(operation);
    if (queue.length > this.maxPendingOperations) {
      queue.splice(queue[0].kind === "create" ? 1 : 0, 1);
      this.log({
        level: "error",
        message: "Pending queue full; oldest event dropped",
        operation: "appendEvent",
        sessionId,
        queued: queue.length,
      });
    }
  }

  private async flush(sessionId: string): Promise<void> {
    const queue = this.pending.get(sessionId);
    if (!queue?.length) return;
    const credentials = this.credentials();
    if (!credentials) {
      this.log({ level: "error", message: "No turn credentials; operations stay queued", operation: "appendEvent", sessionId, queued: queue.length });
      return;
    }
    const waited = queue.length > 1;
    while (queue.length) {
      const outcome = await this.send(queue[0], sessionId, credentials);
      if (outcome === "retry") return;
      queue.shift();
    }
    this.pending.delete(sessionId);
    if (waited) this.log({ level: "info", message: "Queued operations sent", sessionId });
  }

  private async send(operation: PendingOperation, sessionId: string, credentials: HarnessCredentials): Promise<Outcome> {
    const name = operation.kind === "create" ? "createSession" : "appendEvent";
    const path = operation.kind === "create" ? SESSIONS_PATH : `${SESSIONS_PATH}/${encodeURIComponent(sessionId)}/events`;
    const body = operation.kind === "create" ? operation.body : operation.event;
    const ok = operation.kind === "create" ? [201, 409] : [200];
    let status: number;
    let json: unknown;
    try {
      ({ status, json } = await callHarness(this.fetchImpl, credentials, this.timeoutMs, "POST", path, body));
    } catch (error) {
      this.log({ level: "error", message: "Agent Harness call failed; operation queued", operation: name, sessionId, error: errorText(error), queued: this.pending.get(sessionId)?.length });
      return "retry";
    }
    if (ok.includes(status)) {
      const lastUpdateTime = (json as { lastUpdateTime?: unknown } | undefined)?.lastUpdateTime;
      if (operation.kind === "event" && typeof lastUpdateTime === "number") {
        operation.session.lastUpdateTime = lastUpdateTime;
      }
      return "done";
    }
    if (isRetryableStatus(status)) {
      this.log({ level: "error", message: "Agent Harness rejected operation; queued", operation: name, sessionId, status, queued: this.pending.get(sessionId)?.length });
      return "retry";
    }
    this.log({ level: "error", message: "Agent Harness rejected operation; dropped", operation: name, sessionId, status });
    return "dropped";
  }

  // Runs the calls for one session one at a time, in call order.
  private serialize<T>(sessionId: string, fn: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(sessionId) ?? Promise.resolve();
    const result = previous.then(fn);
    const tail = result.then(
      () => undefined,
      () => undefined,
    );
    this.locks.set(sessionId, tail);
    void tail.then(() => {
      if (this.locks.get(sessionId) === tail) this.locks.delete(sessionId);
    });
    return result;
  }
}
