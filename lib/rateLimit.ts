interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit = Number(process.env.RATE_LIMIT_MAX ?? 60), windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000)): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function getClientIp(headers: { [key: string]: string | string[] | undefined }, socketAddress?: string): string {
  const forwarded = headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  if (Array.isArray(forwarded) && forwarded[0]) return forwarded[0];
  return socketAddress ?? 'unknown';
}
