import { Injectable, Logger } from '@nestjs/common';
import type { TransactionPostedJob, TransactionPostedPublisher } from './queue.tokens';

@Injectable()
export class NoopTransactionPostedPublisher implements TransactionPostedPublisher {
  private readonly logger = new Logger(NoopTransactionPostedPublisher.name);

  async publish(job: TransactionPostedJob): Promise<void> {
    this.logger.debug(`Skipping queue publish (no REDIS_URL): ${job.transactionId}`);
  }
}
