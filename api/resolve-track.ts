import type { VercelRequest, VercelResponse } from '../lib/vercel';
import { z } from 'zod';
import { getClientIp, checkRateLimit } from '../lib/rateLimit';
import { ProviderError, ProviderResolver } from '../lib/providers/ProviderResolver';

const schema = z.object({
  url: z.string().trim().min(1, 'Audio input is required').max(4096, 'Audio input is too long'),
});

interface ApiErrorBody {
  error: true;
  message: string;
  details?: string;
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== 'POST') {
    sendError(response, 405, 'Method not allowed');
    return;
  }

  const clientIp = getClientIp(request.headers, request.socket.remoteAddress);
  if (!checkRateLimit(clientIp)) {
    sendError(response, 429, 'Too many requests');
    return;
  }

  console.info('[api/resolve-track] incoming request', {
    clientIp,
    contentType: request.headers['content-type'],
    payload: summarizePayload(request.body),
  });

  const parsedBody = parseBody(request.body);
  const parsed = schema.safeParse(parsedBody);
  if (!parsed.success) {
    sendError(response, 400, 'Invalid request body', parsed.error.issues.map((issue) => issue.message).join('; '));
    return;
  }

  try {
    const track = await new ProviderResolver().resolve(parsed.data.url);
    response.status(200).json(track);
  } catch (error) {
    console.error('[api/resolve-track] resolve failed', serializeError(error));
    if (error instanceof ProviderError) {
      sendError(response, error.statusCode, error.message, error.details);
      return;
    }
    sendError(response, 502, 'Unable to resolve track', error instanceof Error ? error.message : String(error));
  }
}

function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

function sendError(response: VercelResponse, statusCode: number, message: string, details?: string): void {
  const body: ApiErrorBody = details ? { error: true, message, details } : { error: true, message };
  response.status(statusCode).json(body);
}

function summarizePayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return typeof payload;
  const candidate = payload as { url?: unknown };
  return { hasUrl: typeof candidate.url === 'string', urlLength: typeof candidate.url === 'string' ? candidate.url.length : 0 };
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack };
  return { message: String(error) };
}
