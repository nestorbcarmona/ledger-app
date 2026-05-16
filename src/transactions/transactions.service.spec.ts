import { Test } from '@nestjs/testing';
import { getToken } from '@willsoto/nestjs-prometheus';
import { AccountsService } from '../accounts/accounts.service';
import { AsyncMutex } from '../ledger/async-mutex';
import { TRANSACTION_POSTED_PUBLISHER } from '../queue/queue.tokens';
import { IdempotencyStore } from './idempotency.store';
import { InMemoryTransactionRepository } from './in-memory-transaction.repository';
import { InMemoryAccountRepository } from '../accounts/in-memory-account.repository';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let accountsRepo: InMemoryAccountRepository;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        InMemoryAccountRepository,
        InMemoryTransactionRepository,
        AsyncMutex,
        IdempotencyStore,
        TransactionsService,
        {
          provide: AccountsService,
          useValue: { invalidateAccountCache: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: TRANSACTION_POSTED_PUBLISHER,
          useValue: { publish: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: getToken('ledger_transactions_attempted_total'),
          useValue: { inc: jest.fn() },
        },
        {
          provide: getToken('ledger_transactions_committed_total'),
          useValue: { inc: jest.fn() },
        },
      ],
    }).compile();

    service = mod.get(TransactionsService);
    accountsRepo = mod.get(InMemoryAccountRepository);
  });

  it('applies a balanced transaction and updates balances per account/entry directions', async () => {
    accountsRepo.create({
      id: 'a1',
      direction: 'debit',
      balance: '0',
    });
    accountsRepo.create({
      id: 'a2',
      direction: 'credit',
      balance: '0',
    });

    await service.create({
      entries: [
        { direction: 'debit', account_id: 'a1', amount: 100 },
        { direction: 'credit', account_id: 'a2', amount: 100 },
      ],
    });

    expect(accountsRepo.getById('a1')?.balance).toBe('100');
    expect(accountsRepo.getById('a2')?.balance).toBe('100');
  });

  it('rejects unbalanced transactions', async () => {
    accountsRepo.create({ id: 'a1', direction: 'debit', balance: '0' });
    accountsRepo.create({ id: 'a2', direction: 'credit', balance: '0' });

    await expect(
      service.create({
        entries: [
          { direction: 'debit', account_id: 'a1', amount: 100 },
          { direction: 'credit', account_id: 'a2', amount: 99 },
        ],
      }),
    ).rejects.toThrow(/balance/i);
  });
});
