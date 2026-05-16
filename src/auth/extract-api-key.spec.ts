import { extractApiKeyFromRequest } from './extract-api-key';

describe('extractApiKeyFromRequest', () => {
  const header = (name: string, value: string) => ({
    header(n: string) {
      if (n.toLowerCase() === name.toLowerCase()) {
        return value;
      }
      return undefined;
    },
  });

  it('reads X-API-Key', () => {
    expect(extractApiKeyFromRequest(header('x-api-key', '  abc  '))).toBe('abc');
  });

  it('reads Bearer token', () => {
    expect(extractApiKeyFromRequest(header('authorization', 'Bearer my-token'))).toBe('my-token');
  });

  it('returns undefined when absent', () => {
    expect(
      extractApiKeyFromRequest({
        header() {
          return undefined;
        },
      }),
    ).toBeUndefined();
  });
});
