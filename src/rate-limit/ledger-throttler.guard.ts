import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { extractApiKeyFromRequest } from '../auth/extract-api-key';

@Injectable()
export class LedgerThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const expressReq = req as unknown as Request;
    const key = extractApiKeyFromRequest(expressReq);
    if (key) {
      return `apiKey:${key}`;
    }
    const ip = expressReq.ip ?? expressReq.socket?.remoteAddress;
    return ip ? `ip:${ip}` : 'ip:unknown';
  }
}
