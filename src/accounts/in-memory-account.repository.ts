import { Injectable } from '@nestjs/common';
import type { AccountRecord } from '../ledger/ledger.types';

@Injectable()
export class InMemoryAccountRepository {
  private readonly accounts = new Map<string, AccountRecord>();

  create(record: AccountRecord): void {
    if (this.accounts.has(record.id)) {
      throw new Error('DUPLICATE_ACCOUNT');
    }
    this.accounts.set(record.id, { ...record });
  }

  getById(id: string): AccountRecord | undefined {
    const row = this.accounts.get(id);
    return row ? { ...row } : undefined;
  }

  updateBalance(id: string, balance: string): void {
    const row = this.accounts.get(id);
    if (!row) {
      throw new Error('MISSING_ACCOUNT');
    }
    this.accounts.set(id, { ...row, balance });
  }

  has(id: string): boolean {
    return this.accounts.has(id);
  }
}
