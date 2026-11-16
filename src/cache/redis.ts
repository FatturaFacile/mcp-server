import { Redis } from 'ioredis';
import { config } from '../config/environment.js';

export interface ICacheManager {
  get<T>(tenantId: string, companyId: string, key: string): Promise<T | null>;
  set<T>(
    tenantId: string,
    companyId: string,
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void>;
  del(tenantId: string, companyId: string, key: string): Promise<void>;
  invalidatePrefix(tenantId: string, companyId: string, prefix: string): Promise<void>;
}

export class MultiTenantCacheManager implements ICacheManager {
  private redis: Redis | null = null;
  private readonly memoryStore = new Map<string, { value: string; expiresAt: number }>();
  private isConnected = false;

  constructor() {
    this.initRedis();
  }

  private initRedis(): void {
    try {
      this.redis = new Redis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD || undefined,
        db: config.REDIS_DB,
        lazyConnect: true,
        retryStrategy: () => null, // disable constant reconnect spam in local tests without redis
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
      });

      this.redis.on('error', () => {
        this.isConnected = false;
      });
    } catch {
      this.isConnected = false;
    }
  }

  private buildKey(tenantId: string, companyId: string, key: string): string {
    return `tenant:${tenantId}:company:${companyId}:${key}`;
  }

  public async get<T>(tenantId: string, companyId: string, key: string): Promise<T | null> {
    const fullKey = this.buildKey(tenantId, companyId, key);

    if (this.isConnected && this.redis) {
      try {
        const raw = await this.redis.get(fullKey);
        if (raw) return JSON.parse(raw) as T;
      } catch {
        // Fallback to in-memory on redis glitch
      }
    }

    const entry = this.memoryStore.get(fullKey);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(fullKey);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  public async set<T>(
    tenantId: string,
    companyId: string,
    key: string,
    value: T,
    ttlSeconds: number = config.CACHE_TTL_SECONDS,
  ): Promise<void> {
    const fullKey = this.buildKey(tenantId, companyId, key);
    const serialized = JSON.stringify(value);

    if (this.isConnected && this.redis) {
      try {
        await this.redis.setex(fullKey, ttlSeconds, serialized);
        return;
      } catch {
        // fallback to memory
      }
    }

    this.memoryStore.set(fullKey, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  public async del(tenantId: string, companyId: string, key: string): Promise<void> {
    const fullKey = this.buildKey(tenantId, companyId, key);
    if (this.isConnected && this.redis) {
      try {
        await this.redis.del(fullKey);
      } catch {
        // ignore
      }
    }
    this.memoryStore.delete(fullKey);
  }

  public async invalidatePrefix(
    tenantId: string,
    companyId: string,
    prefix: string,
  ): Promise<void> {
    const keyPrefix = this.buildKey(tenantId, companyId, prefix);
    if (this.isConnected && this.redis) {
      try {
        const keys = await this.redis.keys(`${keyPrefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch {
        // ignore
      }
    }

    for (const k of this.memoryStore.keys()) {
      if (k.startsWith(keyPrefix)) {
        this.memoryStore.delete(k);
      }
    }
  }
}

export const cacheManager = new MultiTenantCacheManager();
