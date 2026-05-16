export const TRANSACTION_POSTED_QUEUE = 'transaction-posted';

export interface TransactionPostedJob {
  transactionId: string;
  accountIds: string[];
}

export const TRANSACTION_POSTED_PUBLISHER = Symbol('TRANSACTION_POSTED_PUBLISHER');

export interface TransactionPostedPublisher {
  publish(job: TransactionPostedJob): Promise<void>;
}
