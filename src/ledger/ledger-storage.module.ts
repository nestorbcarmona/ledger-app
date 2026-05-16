import { Global, Module } from '@nestjs/common';
import { AsyncMutex } from './async-mutex';
import { InMemoryAccountRepository } from '../accounts/in-memory-account.repository';
import { InMemoryTransactionRepository } from '../transactions/in-memory-transaction.repository';

@Global()
@Module({
  providers: [InMemoryAccountRepository, InMemoryTransactionRepository, AsyncMutex],
  exports: [InMemoryAccountRepository, InMemoryTransactionRepository, AsyncMutex],
})
export class LedgerStorageModule {}
