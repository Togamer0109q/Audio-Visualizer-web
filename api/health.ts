import type { VercelRequest, VercelResponse } from '../lib/vercel';

export default function handler(_request: VercelRequest, response: VercelResponse): void {
  response.status(200).json({ status: 'ok' });
}
