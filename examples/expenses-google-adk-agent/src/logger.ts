// Verbose console logging: stdout/stderr of the process is where to look
// when a turn misbehaves. Every call site that logs goes through here so the
// format (timestamp, scope, message, JSON data) stays consistent and
// greppable.

const MAX_LOG_VALUE_LENGTH = 20_000;

function timestamp(): string {
  return new Date().toISOString();
}

function format(scope: string, message: string, data?: unknown): string {
  const base = `[${timestamp()}] [${scope}] ${message}`;
  if (data === undefined) return base;
  try {
    return `${base} ${JSON.stringify(data)}`;
  } catch {
    return `${base} <unserializable log data>`;
  }
}

export function logInfo(scope: string, message: string, data?: unknown): void {
  console.log(format(scope, message, data));
}

export function logWarn(scope: string, message: string, data?: unknown): void {
  console.warn(format(scope, message, data));
}

export function logError(scope: string, message: string, data?: unknown): void {
  console.error(format(scope, message, data));
}

// Caps how much of a payload lands in logs -- a base64 file part or a long
// conversation history would otherwise flood stdout for one request.
export function truncate(value: string, maxLength = MAX_LOG_VALUE_LENGTH): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...<truncated ${value.length - maxLength} more chars>`;
}

// Never logs a credential's actual value -- only enough (prefix/suffix/length)
// to tell turns/tokens apart across log lines.
export function redactSecret(value: string | undefined): string {
  if (!value) return "<absent>";
  if (value.length <= 8) return "<redacted>";
  return `${value.slice(0, 4)}...${value.slice(-4)} (len=${value.length})`;
}
