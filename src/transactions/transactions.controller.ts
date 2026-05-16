import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(ApiKeyGuard)
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post()
  create(@Body() dto: CreateTransactionDto, @Headers('idempotency-key') idempotencyKey?: string) {
    return this.transactions.create(dto, idempotencyKey?.trim() || undefined);
  }
}
