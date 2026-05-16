import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import type { CacheManagerOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { AccountsMetrics } from './accounts.metrics';
import { LedgerStorageModule } from '../ledger/ledger-storage.module';

@Module({
  imports: [
    LedgerStorageModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): CacheManagerOptions => {
        const redisUrl = config.get<string>('REDIS_URL')?.trim();
        const ttl = Number(config.get('ACCOUNT_CACHE_TTL_MS', 30_000)) || 30_000;
        if (redisUrl) {
          return {
            ttl,
            stores: [new Keyv(new KeyvRedis(redisUrl))],
          };
        }
        return { ttl };
      },
    }),
  ],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsMetrics],
  exports: [AccountsService, AccountsMetrics],
})
export class AccountsModule {}
