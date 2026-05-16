import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { LedgerStorageModule } from '../ledger/ledger-storage.module';
import { LedgerQueueModule } from '../queue/ledger-queue.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { IdempotencyStore } from './idempotency.store';

@Module({
  imports: [LedgerStorageModule, AccountsModule, LedgerQueueModule.register()],
  controllers: [TransactionsController],
  providers: [TransactionsService, IdempotencyStore],
})
export class TransactionsModule {}
