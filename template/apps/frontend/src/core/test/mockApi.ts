import { vi } from 'vitest';

type Handler = (request: Request) => Response | Promise<Response>;

export function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function matches(pattern: string, key: string): boolean {
  const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '[^/]+')}$`);
  return regex.test(key);
}

/**
 * Stub fetch with handlers keyed by "METHOD /path" (":param" matches a segment).
 * Unhandled requests return a 404 error envelope, so a missing handler fails loudly.
 */
export function mockApi(handlers: Record<string, Handler>) {
  const requests: Request[] = [];
  const fetchMock = vi.fn(async (request: Request) => {
    requests.push(request.clone());
    const key = `${request.method} ${new URL(request.url).pathname}`;
    const handler = Object.entries(handlers).find(([pattern]) => matches(pattern, key))?.[1];
    if (!handler) {
      return json(404, { error: { code: 'NOT_FOUND', message: `No mock for ${key}` } });
    }
    return handler(request);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { requests, fetchMock };
}
