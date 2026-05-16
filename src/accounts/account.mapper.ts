import { v4 as uuidv4 } from 'uuid';
import type { AccountRecord } from '../ledger/ledger.types';
import { parseUsdAmount } from '../ledger/ledger.math';

export function accountToResponse(a: AccountRecord) {
  return {
    id: a.id,
    name: a.name,
    direction: a.direction,
    balance: parseUsdAmount(a.balance).toNumber(),
  };
}

export function newAccountId(proposed?: string): string {
  return proposed ?? uuidv4();
}
