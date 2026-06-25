import type { VercelRequest, VercelResponse } from '../lib/vercel';
import { z } from 'zod';
import { getClientIp, checkRateLimit } from '../lib/rateLimit';
import { TrackService } from '../lib/soundcloud/tracks';

const schema = z.object({
  trackId: z.string().trim().min(1, 'trackId is required').regex(/^\d+$/, 'trackId must be numeric'),
  source: z.enum(['soundcloud', 'youtube', 'local']).optional().default('soundcloud'),
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

  console.info('[api/stream] incoming request', {
    clientIp,
    contentType: request.headers['content-type'],
    payload: summarizePayload(request.body),
  });

  const parsed = schema.safeParse(parseBody(request.body));
  if (!parsed.success) {
    sendError(response, 400, 'Invalid request body', parsed.error.issues.map((issue) => issue.message).join('; '));
    return;
  }
  if (parsed.data.source !== 'soundcloud') {
    response.status(200).json({ streamUrl: null, playable: false, source: parsed.data.source, reason: 'not_implemented' });
    return;
  }
  if (!process.env.SOUNDCLOUD_CLIENT_ID || !process.env.SOUNDCLOUD_CLIENT_SECRET) {
    sendError(response, 503, 'SoundCloud provider unavailable');
    return;
  }
  try {
    const stream = await new TrackService().getPlayableStream(parsed.data.trackId);
    response.status(200).json({ ...stream, source: 'soundcloud' });
  } catch (error) {
    console.error('[api/stream] stream resolution failed', serializeError(error));
    sendError(response, 502, 'Unable to resolve stream', error instanceof Error ? error.message : String(error));
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
  const candidate = payload as { trackId?: unknown; source?: unknown };
  return { hasTrackId: typeof candidate.trackId === 'string', source: candidate.source };
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack };
  return { message: String(error) };
}
