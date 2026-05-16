import { Injectable } from '@nestjs/common';

interface IdempotencyRecord<T> {
  expiresAtMs: number;
  payload: T;
}

const DEFAULT_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class IdempotencyStore {
  private readonly store = new Map<string, IdempotencyRecord<unknown>>();

  get<T>(key: string): T | undefined {
    const row = this.store.get(key);
    if (!row) {
      return undefined;
    }
    if (Date.now() > row.expiresAtMs) {
      this.store.delete(key);
      return undefined;
    }
    return row.payload as T;
  }

  set<T>(key: string, payload: T, ttlMs = DEFAULT_TTL_MS): void {
    this.store.set(key, { expiresAtMs: Date.now() + ttlMs, payload });
  }
}
