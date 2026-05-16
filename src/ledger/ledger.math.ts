import Decimal from 'decimal.js';
import type { AccountDirection, EntryDirection } from './ledger.types';

export function parseUsdAmount(value: number | string): Decimal {
  return new Decimal(value);
}

/** Balance delta for one entry: same direction as account adds; different subtracts. */
export function balanceDeltaForEntry(
  accountDirection: AccountDirection,
  entryDirection: EntryDirection,
  amount: Decimal,
): Decimal {
  return accountDirection === entryDirection ? amount : amount.neg();
}

export function assertDoubleEntryBalanced(
  entries: { direction: EntryDirection; amount: Decimal }[],
): void {
  const debitTotal = entries
    .filter((e) => e.direction === 'debit')
    .reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
  const creditTotal = entries
    .filter((e) => e.direction === 'credit')
    .reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
  if (!debitTotal.equals(creditTotal)) {
    throw new Error('UNBALANCED');
  }
}
