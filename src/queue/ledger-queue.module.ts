import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TRANSACTION_POSTED_PUBLISHER, TRANSACTION_POSTED_QUEUE } from './queue.tokens';
import { BullTransactionPostedPublisher } from './bull-transaction-posted.publisher';
import { NoopTransactionPostedPublisher } from './noop-transaction-posted.publisher';
import { TransactionPostedProcessor } from './transaction-posted.processor';

@Module({})
export class LedgerQueueModule {
  static register(): DynamicModule {
    const redisUrl = process.env.REDIS_URL?.trim();
    if (!redisUrl) {
      return {
        module: LedgerQueueModule,
        providers: [
          { provide: TRANSACTION_POSTED_PUBLISHER, useClass: NoopTransactionPostedPublisher },
        ],
        exports: [TRANSACTION_POSTED_PUBLISHER],
      };
    }
    return {
      module: LedgerQueueModule,
      imports: [
        BullModule.forRoot({
          connection: { url: redisUrl },
        }),
        BullModule.registerQueue({
          name: TRANSACTION_POSTED_QUEUE,
        }),
      ],
      providers: [
        TransactionPostedProcessor,
        { provide: TRANSACTION_POSTED_PUBLISHER, useClass: BullTransactionPostedPublisher },
      ],
      exports: [TRANSACTION_POSTED_PUBLISHER, BullModule],
    };
  }
}
