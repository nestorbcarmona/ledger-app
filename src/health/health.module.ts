import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisPingHealthIndicator } from './redis-ping.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [RedisPingHealthIndicator],
})
export class HealthModule {}
