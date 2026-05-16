import { v4 as uuidv4 } from 'uuid';
import type { PersistedLedgerEntry, PersistedTransaction } from '../ledger/ledger.types';
import { parseUsdAmount } from '../ledger/ledger.math';

export function transactionToResponse(tx: PersistedTransaction) {
  return {
    id: tx.id,
    name: tx.name,
    entries: tx.entries.map((e) => ({
      id: e.id,
      account_id: e.account_id,
      direction: e.direction,
      amount: parseUsdAmount(e.amount).toNumber(),
    })),
  };
}

export function newEntryIds(entries: { account_id: string; direction: string; amount: number }[]) {
  return entries.map(
    (e): PersistedLedgerEntry => ({
      id: uuidv4(),
      account_id: e.account_id,
      direction: e.direction as PersistedLedgerEntry['direction'],
      amount: parseUsdAmount(e.amount).toFixed(),
    }),
  );
}
