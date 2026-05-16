import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Counter, Histogram } from 'prom-client';
import type { NextFunction, Request, Response } from 'express';
import { normalizeMetricRoute } from './normalize-metric-route';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(
    @InjectMetric('http_request_duration_seconds')
    private readonly httpDurationHistogram: Histogram<string>,
    @InjectMetric('http_requests_total')
    private readonly httpRequestsCounter: Counter<string>,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const pathOnly = (req.originalUrl ?? req.url ?? '/').split('?')[0] ?? '/';
    if (req.method === 'GET' && pathOnly === '/metrics') {
      next();
      return;
    }

    const start = performance.now();
    res.once('finish', () => {
      const durationSec = (performance.now() - start) / 1000;
      const method = req.method;
      const route = normalizeMetricRoute(pathOnly);
      const status = String(res.statusCode);
      const labels = { method, route, status };
      this.httpDurationHistogram.observe(labels, durationSec);
      this.httpRequestsCounter.inc(labels);
    });

    next();
  }
}
