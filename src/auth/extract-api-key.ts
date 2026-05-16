export type RequestWithHeader = {
  header(name: string): string | string[] | undefined;
};

/** Same key extraction as ledger auth: `X-API-Key` or `Authorization: Bearer`. */
export function extractApiKeyFromRequest(req: RequestWithHeader): string | undefined {
  const rawKey = req.header('x-api-key');
  const headerVal = typeof rawKey === 'string' ? rawKey : rawKey?.[0];
  if (headerVal?.trim()) {
    return headerVal.trim();
  }
  const rawAuth = req.header('authorization');
  const auth = typeof rawAuth === 'string' ? rawAuth : rawAuth?.[0];
  if (auth?.toLowerCase().startsWith('bearer ')) {
    const key = auth.slice(7).trim();
    if (key) {
      return key;
    }
  }
  return undefined;
}
