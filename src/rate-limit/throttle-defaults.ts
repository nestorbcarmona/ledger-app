/** Default sliding window duration (ms): one "time slot" for `@nestjs/throttler`. */
export const DEFAULT_THROTTLE_TTL_MS = 60_000;

/** Default max HTTP requests allowed per tracker inside each TTL window (`THROTTLE_TTL_MS`). */
export const DEFAULT_THROTTLE_LIMIT = 120;
