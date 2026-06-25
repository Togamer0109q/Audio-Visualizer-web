import type { VercelRequest, VercelResponse } from '../lib/vercel';
import { z } from 'zod';
import { getClientIp, checkRateLimit } from '../lib/rateLimit';
import { ProviderResolver } from '../lib/providers/ProviderResolver';

const schema = z.object({
  url: z.string().trim().min(1).max(4096),
});

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!checkRateLimit(getClientIp(request.headers, request.socket.remoteAddress))) {
    response.status(429).json({ error: 'Too many requests' });
    return;
  }
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' });
    return;
  }
  try {
    const track = await new ProviderResolver().resolve(parsed.data.url);
    response.status(200).json(track);
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : 'Unable to resolve track' });
  }
}
