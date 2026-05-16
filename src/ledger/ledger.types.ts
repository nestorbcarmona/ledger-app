export type AccountDirection = 'debit' | 'credit';
export type EntryDirection = 'debit' | 'credit';

export interface PersistedLedgerEntry {
  id: string;
  direction: EntryDirection;
  amount: string;
  account_id: string;
}

export interface PersistedTransaction {
  id: string;
  name?: string;
  entries: PersistedLedgerEntry[];
}

export interface AccountRecord {
  id: string;
  name?: string;
  /** Balance in USD as decimal string for stable math */
  balance: string;
  direction: AccountDirection;
}
