/**
 * Performance profiling utility for server-side timing
 * Logs detailed timing information for database queries, API calls, and page loads
 */

interface TimingEntry {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  children: TimingEntry[];
}

interface TimingReport {
  requestId: string;
  url: string;
  method: string;
  totalDuration: number;
  timings: TimingEntry[];
  slowOperations: TimingEntry[];
}

// Store active timings per request
const activeTimings = new Map<string, TimingEntry>();
const requestContexts = new Map<string, {
  url: string;
  method: string;
  rootTiming: TimingEntry;
  startTime: number;
}>();

// Threshold for warning about slow operations (ms)
const SLOW_THRESHOLD = 50;

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Start timing a new request context
 */
export function startRequestTiming(url: string, method: string): string {
  const requestId = generateRequestId();
  const startTime = performance.now();

  const rootTiming: TimingEntry = {
    name: "request",
    startTime,
    children: [],
  };

  requestContexts.set(requestId, {
    url,
    method,
    rootTiming,
    startTime,
  });

  activeTimings.set(requestId, rootTiming);

  return requestId;
}

/**
 * Start timing a specific operation within a request
 */
export function startTiming(
  requestId: string | undefined,
  name: string,
  metadata?: Record<string, unknown>,
): void {
  if (!requestId) return;

  const parent = activeTimings.get(requestId);
  if (!parent) {
    // No active request context
    return;
  }

  const entry: TimingEntry = {
    name,
    startTime: performance.now(),
    metadata,
    children: [],
  };

  parent.children.push(entry);
  activeTimings.set(requestId, entry);
}

/**
 * End timing for the current operation
 */
export function endTiming(requestId: string | undefined): void {
  if (!requestId) return;

  const entry = activeTimings.get(requestId);
  if (!entry || !entry.startTime) return;

  entry.endTime = performance.now();
  entry.duration = entry.endTime - entry.startTime;

  // Find parent and set active back to it
  const context = requestContexts.get(requestId);
  if (context) {
    // Walk back up the tree to find parent
    const findParent = (node: TimingEntry, target: TimingEntry): TimingEntry | null => {
      for (const child of node.children) {
        if (child === target) return node;
        const found = findParent(child, target);
        if (found) return found;
      }
      return null;
    };

    const parent = findParent(context.rootTiming, entry);
    if (parent) {
      activeTimings.set(requestId, parent);
    }
  }
}

/**
 * End the entire request timing and generate report
 */
export function endRequestTiming(requestId: string): TimingReport | null {
  const context = requestContexts.get(requestId);
  if (!context) return null;

  const endTime = performance.now();
  const totalDuration = endTime - context.startTime;

  context.rootTiming.endTime = endTime;
  context.rootTiming.duration = totalDuration;

  // Collect all slow operations
  const slowOperations: TimingEntry[] = [];
  const collectSlow = (entry: TimingEntry) => {
    if (entry.duration && entry.duration >= SLOW_THRESHOLD && entry.name !== "request") {
      slowOperations.push(entry);
    }
    for (const child of entry.children) {
      collectSlow(child);
    }
  };
  collectSlow(context.rootTiming);

  // Sort by duration desc
  slowOperations.sort((a, b) => (b.duration || 0) - (a.duration || 0));

  const report: TimingReport = {
    requestId,
    url: context.url,
    method: context.method,
    totalDuration,
    timings: context.rootTiming.children,
    slowOperations,
  };

  // Cleanup
  requestContexts.delete(requestId);
  activeTimings.delete(requestId);

  return report;
}

/**
 * Format timing report for logging
 */
export function formatTimingReport(report: TimingReport): string {
  const lines: string[] = [];
  lines.push(`[PERF] ${report.method} ${report.url} - ${report.totalDuration.toFixed(2)}ms total`);

  if (report.slowOperations.length > 0) {
    lines.push(`[PERF] Slow operations (>${SLOW_THRESHOLD}ms):`);
    for (const op of report.slowOperations.slice(0, 10)) {
      const meta = op.metadata ? ` ${JSON.stringify(op.metadata)}` : "";
      lines.push(`[PERF]   - ${op.name}: ${op.duration?.toFixed(2)}ms${meta}`);
    }
  }

  // Log all operations if total time is high
  if (report.totalDuration > 200) {
    lines.push(`[PERF] All operations:`);
    const logEntry = (entry: TimingEntry, depth: number = 0) => {
      const indent = "  ".repeat(depth);
      const meta = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : "";
      lines.push(`[PERF] ${indent}- ${entry.name}: ${entry.duration?.toFixed(2)}ms${meta}`);
      for (const child of entry.children) {
        logEntry(child, depth + 1);
      }
    };
    for (const entry of report.timings) {
      logEntry(entry, 0);
    }
  }

  return lines.join("\n");
}

/**
 * Async wrapper that times a function execution
 */
export async function timeAsync<T>(
  requestId: string | undefined,
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>,
): Promise<T> {
  if (!requestId) {
    return fn();
  }
  startTiming(requestId, name, metadata);
  try {
    const result = await fn();
    return result;
  } finally {
    endTiming(requestId);
  }
}

/**
 * Sync wrapper that times a function execution
 */
export function timeSync<T>(
  requestId: string | undefined,
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>,
): T {
  if (!requestId) {
    return fn();
  }
  startTiming(requestId, name, metadata);
  try {
    const result = fn();
    return result;
  } finally {
    endTiming(requestId);
  }
}

/**
 * Get current request ID from async context (store in locals)
 */
export function getCurrentRequestId(locals: App.Locals): string | undefined {
  return locals.requestId as string | undefined;
}

// Extend App.Locals interface
declare global {
  namespace App {
    interface Locals {
      requestId?: string;
    }
  }
}

export { type TimingReport, type TimingEntry };
