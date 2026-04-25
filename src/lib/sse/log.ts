export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  ts: string;
  level: LogLevel;
  source: "PgEventBus";
  event: string;
  [key: string]: unknown;
}

export class SseLogger {
  private buffer: LogEntry[] = [];
  private readonly MAX = 50;

  log(level: LogLevel, event: string, fields: Record<string, unknown> = {}): void {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      source: "PgEventBus",
      event,
      ...fields,
    };
    this.buffer.push(entry);
    if (this.buffer.length > this.MAX) this.buffer.shift();

    const sink =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : console.log;
    sink(JSON.stringify(entry));
  }

  recent(): readonly LogEntry[] {
    return [...this.buffer];
  }
}

const globalForLogger = globalThis as unknown as {
  __cultcodexSseLogger?: SseLogger;
};

export const sseLogger = globalForLogger.__cultcodexSseLogger ?? new SseLogger();

if (process.env.NODE_ENV !== "production") {
  globalForLogger.__cultcodexSseLogger = sseLogger;
}
