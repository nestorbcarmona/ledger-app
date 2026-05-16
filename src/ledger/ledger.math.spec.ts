import Decimal from 'decimal.js';
import { assertDoubleEntryBalanced, balanceDeltaForEntry, parseUsdAmount } from './ledger.math';

describe('ledger.math', () => {
  describe('balanceDeltaForEntry', () => {
    const cases: [string, 'debit' | 'credit', 'debit' | 'credit', string, string][] = [
      ['0 + debit on debit account', 'debit', 'debit', '100', '100'],
      ['0 + credit on credit account', 'credit', 'credit', '100', '100'],
      ['100 - credit on debit account', 'debit', 'credit', '100', '-100'],
      ['100 - debit on credit account', 'credit', 'debit', '100', '-100'],
    ];
    it.each(cases)('%s', (_, accDir, entryDir, amount, expectedDelta) => {
      const d = balanceDeltaForEntry(accDir, entryDir, parseUsdAmount(amount));
      expect(d.toFixed()).toBe(parseUsdAmount(expectedDelta).toFixed());
    });

    // Mirrors the exercise table: starting balance + delta = ending balance.
    const endingCases: [string, string, 'debit' | 'credit', 'debit' | 'credit', string, string][] =
      [
        ['0 → 100 (debit account, debit entry)', '0', 'debit', 'debit', '100', '100'],
        ['0 → 100 (credit account, credit entry)', '0', 'credit', 'credit', '100', '100'],
        ['100 → 0 (debit account, credit entry)', '100', 'debit', 'credit', '100', '0'],
        ['100 → 0 (credit account, debit entry)', '100', 'credit', 'debit', '100', '0'],
      ];
    it.each(endingCases)('%s', (_, start, accDir, entryDir, amount, expectedEnd) => {
      const next = parseUsdAmount(start).plus(
        balanceDeltaForEntry(accDir, entryDir, parseUsdAmount(amount)),
      );
      expect(next.toFixed()).toBe(parseUsdAmount(expectedEnd).toFixed());
    });
  });

  describe('assertDoubleEntryBalanced', () => {
    it('accepts balanced debits and credits', () => {
      expect(() =>
        assertDoubleEntryBalanced([
          { direction: 'debit', amount: new Decimal(100) },
          { direction: 'credit', amount: new Decimal(100) },
        ]),
      ).not.toThrow();
    });

    it('accepts multi-line balancing', () => {
      expect(() =>
        assertDoubleEntryBalanced([
          { direction: 'debit', amount: new Decimal(60) },
          { direction: 'debit', amount: new Decimal(40) },
          { direction: 'credit', amount: new Decimal(50) },
          { direction: 'credit', amount: new Decimal(50) },
        ]),
      ).not.toThrow();
    });

    it('rejects unbalanced entries', () => {
      expect(() =>
        assertDoubleEntryBalanced([
          { direction: 'debit', amount: new Decimal(100) },
          { direction: 'credit', amount: new Decimal(99) },
        ]),
      ).toThrow('UNBALANCED');
    });
  });
});
