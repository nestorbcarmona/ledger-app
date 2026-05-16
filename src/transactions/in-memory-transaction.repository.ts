import { Injectable } from '@nestjs/common';
import type { PersistedTransaction } from '../ledger/ledger.types';

@Injectable()
export class InMemoryTransactionRepository {
  private readonly transactions = new Map<string, PersistedTransaction>();

  create(tx: PersistedTransaction): void {
    if (this.transactions.has(tx.id)) {
      throw new Error('DUPLICATE_TRANSACTION');
    }
    this.transactions.set(tx.id, tx);
  }

  getById(id: string): PersistedTransaction | undefined {
    const row = this.transactions.get(id);
    return row ? (JSON.parse(JSON.stringify(row)) as PersistedTransaction) : undefined;
  }
}
