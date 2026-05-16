import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../common/public.decorator';
import { extractApiKeyFromRequest } from './extract-api-key';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly keys: Set<string>;

  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {
    const raw = this.config.get<string>('LEDGER_API_KEYS', '');
    this.keys = new Set(
      raw
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    if (this.keys.size === 0) {
      throw new UnauthorizedException(
        'Server misconfiguration: set LEDGER_API_KEYS to enable the ledger API',
      );
    }
    const req = context.switchToHttp().getRequest<Request>();
    const key = extractApiKeyFromRequest(req);
    if (!key || !this.keys.has(key)) {
      throw new UnauthorizedException('Missing or invalid API key');
    }
    return true;
  }
}
