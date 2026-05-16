import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { TransactionPostedJob } from './queue.tokens';
import { TRANSACTION_POSTED_QUEUE } from './queue.tokens';

const accountCacheKey = (id: string) => `account:${id}`;

@Processor(TRANSACTION_POSTED_QUEUE)
export class TransactionPostedProcessor extends WorkerHost {
  private readonly logger = new Logger(TransactionPostedProcessor.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {
    super();
  }

  async process(job: Job<TransactionPostedJob>): Promise<void> {
    const { transactionId, accountIds } = job.data;
    await Promise.all(accountIds.map((id) => this.cache.del(accountCacheKey(id))));
    this.logger.log({
      msg: 'transaction_posted',
      transactionId,
      accountIds,
    });
  }
}
