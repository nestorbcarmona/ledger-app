import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import {
  PrometheusModule,
  getToken,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { PublicPrometheusController } from './public-prometheus.controller';
import { HttpMetricsMiddleware } from './http-metrics.middleware';

const ledgerTransactionsAttemptedTotal = makeCounterProvider({
  name: 'ledger_transactions_attempted_total',
  help: 'Ledger transaction commits attempted (past idempotency; one per try)',
});

const ledgerTransactionsCommittedTotal = makeCounterProvider({
  name: 'ledger_transactions_committed_total',
  help: 'Ledger transactions successfully committed',
});

const httpRequestDurationHistogram = makeHistogramProvider({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

const httpRequestsTotal = makeCounterProvider({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const accountOperationsTotal = makeCounterProvider({
  name: 'account_operations_total',
  help: 'Total account operations by type and status',
  labelNames: ['operation', 'status'],
});

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
      controller: PublicPrometheusController,
    }),
  ],
  providers: [
    ledgerTransactionsAttemptedTotal,
    ledgerTransactionsCommittedTotal,
    httpRequestDurationHistogram,
    httpRequestsTotal,
    accountOperationsTotal,
    HttpMetricsMiddleware,
  ],
  exports: [
    PrometheusModule,
    getToken('ledger_transactions_attempted_total'),
    getToken('ledger_transactions_committed_total'),
    getToken('http_request_duration_seconds'),
    getToken('http_requests_total'),
    getToken('account_operations_total'),
  ],
})
export class LedgerMetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpMetricsMiddleware).forRoutes('*');
  }
}
