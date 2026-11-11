/**
 * Simple per-visitor limits so the public demo can't drain the API key.
 * Memory-based: each server instance counts separately and resets on restart.
 * Good enough for a hackathon demo.
 */

type Bucket = { windowMs: number; max: number };

const BUCKETS: Record<string, Bucket> = {
  trial: { windowMs: 60 * 60 * 1000, max: Number(process.env.TRIALS_PER_HOUR) || 10 },
  message: { windowMs: 10 * 60 * 1000, max: 20 },
};

const hits = new Map<string, number[]>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
}

/** Returns true if this visitor may make another request of this kind right now. */
export function allowRequest(ip: string, bucket: keyof typeof BUCKETS = "message"): boolean {
  const { windowMs, max } = BUCKETS[bucket];
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= 60 * 60 * 1000)) hits.delete(k);
  }
  return true;
}
