/**
 * Normalize URL path for Prometheus `route` labels (strip query elsewhere first).
 * Replaces UUID segments with `/:id` and long hex with `/:hex`.
 * Uses fresh RegExp instances per call to avoid `lastIndex` races under concurrency.
 */
export function normalizeMetricRoute(path: string): string {
  if (!path || path === '') {
    return '/';
  }
  const uuidSeg = new RegExp('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'gi');
  const longHex = new RegExp('/[0-9a-f]{16,}(?=/|$)', 'gi');
  const p = path.replace(uuidSeg, '/:id').replace(longHex, '/:hex');
  return p || '/';
}
