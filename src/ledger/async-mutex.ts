import { Injectable } from '@nestjs/common';

/**
 * Single-writer mutex for async critical sections (e.g. in-memory ledger commits).
 */
@Injectable()
export class AsyncMutex {
  private tail = Promise.resolve();

  runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const task = this.tail.then(() => fn());
    this.tail = task.then(
      () => undefined,
      () => undefined,
    );
    return task;
  }
}
