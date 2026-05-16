import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Counter } from 'prom-client';

/**
 * Metrics service for account operations
 *
 * Provides methods to track account-related metrics:
 * - Account creation, updates, deletions
 * - Success/failure status
 */
@Injectable()
export class AccountsMetrics {
  constructor(
    @InjectMetric('account_operations_total')
    private readonly accountOperationsCounter: Counter<string>,
  ) {}

  recordCreate(status: 'success' | 'failed'): void {
    this.accountOperationsCounter.inc({
      operation: 'create',
      status,
    });
  }

  recordUpdate(status: 'success' | 'failed'): void {
    this.accountOperationsCounter.inc({
      operation: 'update',
      status,
    });
  }

  recordDelete(status: 'success' | 'failed'): void {
    this.accountOperationsCounter.inc({
      operation: 'delete',
      status,
    });
  }
}
