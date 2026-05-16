import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { TransactionPostedJob, TransactionPostedPublisher } from './queue.tokens';
import { TRANSACTION_POSTED_QUEUE } from './queue.tokens';

@Injectable()
export class BullTransactionPostedPublisher implements TransactionPostedPublisher {
  constructor(
    @InjectQueue(TRANSACTION_POSTED_QUEUE)
    private readonly queue: Queue,
  ) {}

  async publish(job: TransactionPostedJob): Promise<void> {
    await this.queue.add('posted', job, { removeOnComplete: 1000, attempts: 3 });
  }
}
