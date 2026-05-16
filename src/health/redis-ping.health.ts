import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisPingHealthIndicator extends HealthIndicator {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async ping(key: string): Promise<HealthIndicatorResult> {
    const url = this.config.get<string>('REDIS_URL')?.trim();
    if (!url) {
      return this.getStatus(key, true, { message: 'Redis not configured (optional)' });
    }
    const client = new Redis(url, { maxRetriesPerRequest: 1 });
    try {
      const pong = await client.ping();
      const isHealthy = pong === 'PONG';
      return this.getStatus(key, isHealthy, { response: pong });
    } catch (error) {
      return this.getStatus(key, false, { message: (error as Error).message });
    } finally {
      client.disconnect();
    }
  }
}
