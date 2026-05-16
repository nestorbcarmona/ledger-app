import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Counter } from 'prom-client';
import { v4 as uuidv4 } from 'uuid';
import { AccountsService } from '../accounts/accounts.service';
import { AsyncMutex } from '../ledger/async-mutex';
import {
  assertDoubleEntryBalanced,
  balanceDeltaForEntry,
  parseUsdAmount,
} from '../ledger/ledger.math';
import type { PersistedTransaction } from '../ledger/ledger.types';
import { TRANSACTION_POSTED_PUBLISHER } from '../queue/queue.tokens';
import type { TransactionPostedPublisher } from '../queue/queue.tokens';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { IdempotencyStore } from './idempotency.store';
import { InMemoryAccountRepository } from '../accounts/in-memory-account.repository';
import { InMemoryTransactionRepository } from './in-memory-transaction.repository';
import { newEntryIds, transactionToResponse } from './transaction.mapper';

@Injectable()
export class TransactionsService {
  private readonly tracer = trace.getTracer('ledger-app');

  constructor(
    private readonly accountsRepo: InMemoryAccountRepository,
    private readonly txRepo: InMemoryTransactionRepository,
    private readonly mutex: AsyncMutex,
    private readonly accountsService: AccountsService,
    private readonly idempotency: IdempotencyStore,
    @Inject(TRANSACTION_POSTED_PUBLISHER)
    private readonly postedPublisher: TransactionPostedPublisher,
    @InjectMetric('ledger_transactions_attempted_total')
    private readonly transactionsAttempted: Counter<string>,
    @InjectMetric('ledger_transactions_committed_total')
    private readonly transactionsCommitted: Counter<string>,
  ) {}

  create(dto: CreateTransactionDto, idempotencyKey?: string) {
    return this.mutex.runExclusive(() => this.commitUnderLock(dto, idempotencyKey));
  }

  private async commitUnderLock(dto: CreateTransactionDto, idempotencyKey?: string) {
    if (idempotencyKey) {
      const cached = this.idempotency.get<ReturnType<typeof transactionToResponse>>(idempotencyKey);
      if (cached) {
        return cached;
      }
    }

    return this.tracer.startActiveSpan('ledger.apply_transaction', async (span) => {
      try {
        this.transactionsAttempted.inc();

        const txId = dto.id ?? uuidv4();
        if (this.txRepo.getById(txId)) {
          throw new BadRequestException('Transaction id already exists');
        }

        for (const e of dto.entries) {
          if (!this.accountsRepo.has(e.account_id)) {
            throw new NotFoundException(`Unknown account ${e.account_id}`);
          }
        }

        const parsedAmounts = dto.entries.map((e) => ({
          direction: e.direction,
          amount: parseUsdAmount(e.amount),
        }));

        try {
          assertDoubleEntryBalanced(parsedAmounts);
        } catch {
          throw new BadRequestException(
            'Transaction entries must balance: sum of debits must equal sum of credits',
          );
        }

        const persistedEntries = newEntryIds(dto.entries);

        for (const pe of persistedEntries) {
          const acct = this.accountsRepo.getById(pe.account_id)!;
          const delta = balanceDeltaForEntry(
            acct.direction,
            pe.direction,
            parseUsdAmount(pe.amount),
          );
          const next = parseUsdAmount(acct.balance).plus(delta);
          this.accountsRepo.updateBalance(pe.account_id, next.toFixed());
        }

        const tx: PersistedTransaction = {
          id: txId,
          name: dto.name,
          entries: persistedEntries,
        };
        this.txRepo.create(tx);

        const accountIds = [...new Set(dto.entries.map((e) => e.account_id))];
        await Promise.all(accountIds.map((id) => this.accountsService.invalidateAccountCache(id)));

        const response = transactionToResponse(this.txRepo.getById(txId)!);
        await this.postedPublisher.publish({ transactionId: txId, accountIds });

        this.transactionsCommitted.inc();

        if (idempotencyKey) {
          this.idempotency.set(idempotencyKey, response);
        }
        return response;
      } catch (e) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(e as Error);
        throw e;
      } finally {
        span.end();
      }
    });
  }
}
