import { config } from '../config/environment.js';

interface RateBucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, RateBucket>();
  private readonly maxTokens: number;
  private readonly refillIntervalMs: number;

  constructor(
    maxRequests: number = config.RATE_LIMIT_MAX_REQUESTS,
    windowMs: number = config.RATE_LIMIT_WINDOW_MS,
  ) {
    this.maxTokens = maxRequests;
    this.refillIntervalMs = windowMs;
  }

  public checkLimit(tenantId: string, clientId: string): { allowed: boolean; remaining: number } {
    const key = `${tenantId}:${clientId}`;
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    } else {
      const elapsed = now - bucket.lastRefill;
      if (elapsed >= this.refillIntervalMs) {
        bucket.tokens = this.maxTokens;
        bucket.lastRefill = now;
      }
    }

    if (bucket.tokens > 0) {
      bucket.tokens--;
      return { allowed: true, remaining: bucket.tokens };
    }

    return { allowed: false, remaining: 0 };
  }
}

export const rateLimiter = new RateLimiter();
