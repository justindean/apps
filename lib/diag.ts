/**
 * Temporary diagnostic instrumentation (PR-2, observability only).
 *
 * Gated ON only by:
 *   - the `?debug=taphabla` query param (also persists to localStorage), OR
 *   - a previously-persisted `taphabla_diag=1` flag, OR
 *   - a development build (NODE_ENV === "development").
 *
 * When disabled, every `diag()` / `diagTimer()` call is a cheap no-op and the
 * overlay renders nothing, so normal users see zero UI change.
 *
 * NEVER pass API keys, raw audio, or full user / medical phrases as `detail`.
 * Only context, tone, status codes, timings, counts, and lengths are allowed.
 */

export type DiagChannel = "HEAR" | "SAY" | "DEMO" | "DRAWER" | "SYS" | "MEANING";

export interface DiagEvent {
  id: number;
  /** ms since the first recorded event of this diag session */
  t: number;
  /** raw high-res timestamp at emit time */
  abs: number;
  channel: DiagChannel;
  label: string;
  detail?: string;
}

const MAX_EVENTS = 600;
const events: DiagEvent[] = [];
const listeners = new Set<() => void>();

let counter = 0;
let version = 0;
let sessionStart = 0;
let enabledCache: boolean | null = null;

function perfNow(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function isDiagEnabled(): boolean {
  if (enabledCache !== null) return enabledCache;
  if (typeof window === "undefined") return false;

  let on = false;
  try {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("debug") === "taphabla";
    if (flag) {
      try {
        window.localStorage.setItem("taphabla_diag", "1");
      } catch {
        /* private mode */
      }
    }
    let persisted = false;
    try {
      persisted = window.localStorage.getItem("taphabla_diag") === "1";
    } catch {
      /* private mode */
    }
    on = flag || persisted || process.env.NODE_ENV === "development";
  } catch {
    on = false;
  }

  enabledCache = on;
  return on;
}

export function diag(channel: DiagChannel, label: string, detail?: string): void {
  if (!isDiagEnabled()) return;
  const abs = perfNow();
  if (sessionStart === 0) sessionStart = abs;
  counter += 1;
  version += 1;
  events.push({ id: counter, t: Math.round(abs - sessionStart), abs, channel, label, detail });
  if (events.length > MAX_EVENTS) events.shift();
  listeners.forEach((fn) => fn());
}

/**
 * Emits `"<label> start"` immediately and returns a function that, when called,
 * emits `"<label> end"` with the elapsed milliseconds (and an optional status).
 * Returns a no-op when diagnostics are disabled.
 */
export function diagTimer(channel: DiagChannel, label: string, startDetail?: string) {
  if (!isDiagEnabled()) return (_status?: string) => {};
  const start = perfNow();
  diag(channel, `${label} start`, startDetail);
  return (status?: string) => {
    const ms = Math.round(perfNow() - start);
    diag(channel, `${label} end`, status ? `${status} · ${ms}ms` : `${ms}ms`);
  };
}

export function getDiagEvents(): DiagEvent[] {
  return events;
}

export function getDiagVersion(): number {
  return version;
}

export function subscribeDiag(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function clearDiag(): void {
  events.length = 0;
  counter = 0;
  version += 1;
  sessionStart = 0;
  listeners.forEach((fn) => fn());
}
