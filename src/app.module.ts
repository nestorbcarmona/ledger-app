import { randomUUID } from 'crypto';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { ApiKeyGuard } from './auth/api-key.guard';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { LedgerStorageModule } from './ledger/ledger-storage.module';
import { HealthModule } from './health/health.module';
import { LedgerMetricsModule } from './observability/ledger-metrics.module';
import { LedgerThrottlerGuard } from './rate-limit/ledger-throttler.guard';
import { DEFAULT_THROTTLE_LIMIT, DEFAULT_THROTTLE_TTL_MS } from './rate-limit/throttle-defaults';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const ttlRaw = Number(config.get('THROTTLE_TTL_MS', DEFAULT_THROTTLE_TTL_MS));
        const ttl = Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : DEFAULT_THROTTLE_TTL_MS;
        const limitRaw = Number(config.get('THROTTLE_LIMIT', DEFAULT_THROTTLE_LIMIT));
        const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : DEFAULT_THROTTLE_LIMIT;
        return [{ ttl, limit }];
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req, res) => {
          const raw = req.headers['x-request-id'];
          const fromHeader = Array.isArray(raw) ? raw[0] : raw;
          const id = fromHeader?.trim() ? fromHeader.trim() : randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        customProps: (req) => ({
          requestId: (req as { id?: string }).id,
        }),
        serializers: {
          req(req) {
            return {
              id: req.id,
              method: req.method,
              url: req.url,
              headers: {
                host: req.headers?.host,
                'x-request-id': req.headers?.['x-request-id'],
                'content-type': req.headers?.['content-type'],
              },
            };
          },
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
            : undefined,
      },
    }),
    LedgerMetricsModule,
    LedgerStorageModule,
    AuthModule,
    AccountsModule,
    TransactionsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: LedgerThrottlerGuard },
    { provide: APP_GUARD, useClass: ApiKeyGuard },
  ],
})
export class AppModule {}
