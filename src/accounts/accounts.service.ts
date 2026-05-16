import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { CreateAccountDto } from './dto/create-account.dto';
import { InMemoryAccountRepository } from './in-memory-account.repository';
import { accountToResponse, newAccountId } from './account.mapper';
import { AccountsMetrics } from './accounts.metrics';
import { parseUsdAmount } from '../ledger/ledger.math';

const accountCacheKey = (id: string) => `account:${id}`;

@Injectable()
export class AccountsService {
  constructor(
    private readonly accounts: InMemoryAccountRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly config: ConfigService,
    private readonly metrics: AccountsMetrics,
  ) {}

  private cacheTtlMs(): number {
    const n = Number(this.config.get('ACCOUNT_CACHE_TTL_MS', 30_000));
    return Number.isFinite(n) && n > 0 ? n : 30_000;
  }

  async create(dto: CreateAccountDto) {
    const id = newAccountId(dto.id);
    const balance = parseUsdAmount(dto.balance ?? 0).toFixed();
    try {
      this.accounts.create({
        id,
        name: dto.name,
        balance,
        direction: dto.direction,
      });
    } catch (e) {
      this.metrics.recordCreate('failed');
      if (e instanceof Error && e.message === 'DUPLICATE_ACCOUNT') {
        throw new BadRequestException('Account id already exists');
      }
      throw e;
    }
    const created = this.accounts.getById(id)!;
    await this.cache.set(accountCacheKey(id), accountToResponse(created), this.cacheTtlMs());
    this.metrics.recordCreate('success');
    return accountToResponse(created);
  }

  async getById(id: string) {
    const cached = await this.cache.get<ReturnType<typeof accountToResponse>>(accountCacheKey(id));
    if (cached) {
      return cached;
    }
    const row = this.accounts.getById(id);
    if (!row) {
      throw new NotFoundException('Account not found');
    }
    const body = accountToResponse(row);
    await this.cache.set(accountCacheKey(id), body, this.cacheTtlMs());
    return body;
  }

  async invalidateAccountCache(id: string): Promise<void> {
    await this.cache.del(accountCacheKey(id));
  }
}
