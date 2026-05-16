# Agent notes (Ledger App)

Concise context for coding agents. Full setup and API examples live in [README.md](README.md).

## Stack

- **Runtime**: Node.js 20+ recommended
- **Framework**: NestJS 11 (Express)
- **Data**: In-memory account and transaction repositories (`LedgerStorageModule`); not a SQL database
- **Optional**: Redis (`REDIS_URL`) for account read-through cache + BullMQ `transaction-posted` queue

## Commands

| Command | Use |
|--------|-----|
| `npm install` | Dependencies |
| `npm run start:dev` | Local dev (watch) |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run `node dist/main` after build |
| `npm test` | Jest (ledger math + transaction service) |
| `npm run lint` | ESLint (may apply fixes) |
| `npm run format` | Prettier on `src/` and `test/` |

## Environment

Copy [.env.example](.env.example) to `.env` if you use local env files (`main.ts` loads `dotenv/config`). Required for ledger HTTP routes: **`LEDGER_API_KEYS`** (comma-separated). See README for full variable table (`PORT`, `REDIS_URL`, `ACCOUNT_CACHE_TTL_MS`, OpenTelemetry, **`THROTTLE_TTL_MS` / `THROTTLE_LIMIT`**, etc.).

## Source layout

| Path | Role |
|------|------|
| `src/main.ts` | Bootstrap, optional OTEL, `ValidationPipe`, shutdown hooks |
| `src/app.module.ts` | Root module: config, Pino, metrics, throttling, storage, auth guard, feature modules |
| `src/ledger/` | Shared ledger types/math, `AsyncMutex` (transaction commits run under lock) |
| `src/accounts/` | Accounts API, cache, in-memory account repository |
| `src/transactions/` | Transactions API, idempotency, repositories, OTEL spans |
| `src/queue/` | BullMQ vs noop publisher for post-commit work |
| `src/auth/` | Global API key guard; shared `extractApiKeyFromRequest`; `@Public()` for `/health` and `/metrics` |
| `src/rate-limit/` | Global `LedgerThrottlerGuard` (extends `@nestjs/throttler`) |
| `src/health/` | Terminus health checks |
| `src/observability/` | Prometheus metrics and HTTP metrics middleware |

## Invariants (do not break lightly)

- **Double-entry**: Debits must equal credits; balance updates follow account `direction` vs entry `direction` (see `src/ledger/ledger.math.ts`).
- **Concurrency**: `TransactionsService.create` uses `AsyncMutex` so commits do not interleave.
- **Idempotency**: `Idempotency-Key` on `POST /transactions` is in-memory with TTL (~30 minutes).
- **Rate limits**: Global [`LedgerThrottlerGuard`](src/rate-limit/ledger-throttler.guard.ts) with sliding window configured from env (`THROTTLE_TTL_MS`, `THROTTLE_LIMIT`); defaults in [`throttle-defaults.ts`](src/rate-limit/throttle-defaults.ts). In-memory storage—**per process**; tracker is API key when present else IP. `/health` and `/metrics` use `@SkipThrottle`.
- **Metrics**: Ledger-specific counters and HTTP histograms live in `LedgerMetricsModule`; keep cardinality bounded (normalized routes).

## Hygiene

- Do not commit `.env` or real API keys.
- `dist/` is gitignored; run `npm run build` after source changes if you need compiled output locally.
