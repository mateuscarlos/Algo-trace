import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface StoredTrace {
  id: string;
  userId: string;
  title: string;
  trace: unknown;
  savedAt: string;
  category?: string;
  tags?: string[];
}

export interface TraceUpdates {
  title?: string;
  category?: string;
}

function isStoredTrace(value: unknown): value is StoredTrace {
  if (typeof value !== 'object' || value === null) return false;
  const trace = value as Record<string, unknown>;
  return typeof trace.id === 'string'
    && typeof trace.userId === 'string'
    && typeof trace.title === 'string'
    && typeof trace.savedAt === 'string'
    && typeof trace.trace === 'object'
    && trace.trace !== null
    && (trace.category === undefined || typeof trace.category === 'string')
    && (trace.tags === undefined
      || (Array.isArray(trace.tags) && trace.tags.every((tag) => typeof tag === 'string')));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class TraceStore {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath)) this.writeTraces([]);
  }

  listForUser(userId: string): StoredTrace[] {
    return this.readTraces().filter((trace) => trace.userId === userId);
  }

  getForUser(id: string, userId: string): StoredTrace | undefined {
    return this.readTraces().find((trace) => trace.id === id && trace.userId === userId);
  }

  create(userId: string, title: string, trace: unknown, category?: string, tags?: string[]): StoredTrace {
    const traces = this.readTraces();
    const savedTrace: StoredTrace = {
      id: randomUUID(),
      userId,
      title,
      trace,
      savedAt: new Date().toISOString(),
      ...(category ? { category } : {}),
      ...(tags?.length ? { tags } : {}),
    };

    traces.push(savedTrace);
    this.writeTraces(traces);
    return savedTrace;
  }

  updateForUser(id: string, userId: string, updates: TraceUpdates): StoredTrace | undefined {
    const traces = this.readTraces();
    const trace = traces.find((item) => item.id === id && item.userId === userId);
    if (!trace) return undefined;

    if (updates.title !== undefined) trace.title = updates.title;
    if (updates.category !== undefined) {
      if (updates.category) trace.category = updates.category;
      else delete trace.category;
    }

    this.writeTraces(traces);
    return trace;
  }

  deleteForUser(id: string, userId: string): boolean {
    const traces = this.readTraces();
    const remaining = traces.filter((trace) => trace.id !== id || trace.userId !== userId);
    if (remaining.length === traces.length) return false;

    this.writeTraces(remaining);
    return true;
  }

  importTraces(imported: StoredTrace[]): { imported: number; skipped: number } {
    const traces = this.readTraces();
    const existingById = new Map(traces.map((trace) => [trace.id, trace]));
    let importedCount = 0;
    let skippedCount = 0;

    for (const trace of imported) {
      if (!isStoredTrace(trace)) {
        throw new Error('Firestore export contains a trace with an invalid or missing owner.');
      }

      const existing = existingById.get(trace.id);
      if (existing) {
        if (existing.userId !== trace.userId) {
          throw new Error(`Trace ID collision with a different owner: ${trace.id}`);
        }
        skippedCount += 1;
        continue;
      }

      traces.push(trace);
      existingById.set(trace.id, trace);
      importedCount += 1;
    }

    if (importedCount > 0) this.writeTraces(traces);
    return { imported: importedCount, skipped: skippedCount };
  }

  private readTraces(): StoredTrace[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8')) as unknown;
    } catch (error) {
      console.error(`Unable to read trace store at ${this.filePath}`, error);
      throw new Error('O arquivo local de traces está ilegível. Corrija ou restaure um backup antes de continuar.');
    }

    if (!Array.isArray(parsed) || !parsed.every(isStoredTrace)) {
      throw new Error('O arquivo local de traces contém dados inválidos ou sem userId. Atribua os proprietários antes de continuar.');
    }
    return parsed;
  }

  private writeTraces(traces: StoredTrace[]): void {
    const temporaryPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    try {
      fs.writeFileSync(temporaryPath, JSON.stringify(traces, null, 2), {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      });
      fs.renameSync(temporaryPath, this.filePath);
    } finally {
      if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    }
  }
}

export function isFirestoreTrace(value: unknown): value is Record<string, unknown> {
  return isObject(value);
}
