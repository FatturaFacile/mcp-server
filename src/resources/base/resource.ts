import { ResourceMetadata } from '../../types/mcp.js';
import { ExecutionContext } from '../../types/context.js';
import { cacheManager } from '../../cache/redis.js';
import { auditLogger } from '../../audit/logger.js';
import { UnauthorizedError } from '../../errors/auth.js';

export interface ResourceResult<T = unknown> {
  readonly uri: string;
  readonly mimeType: string;
  readonly content: T;
  readonly metadata?: {
    readonly durationMs: number;
    readonly cached?: boolean;
    readonly tenantId: string;
  };
}

export abstract class BaseResource<TOutput = unknown> {
  public abstract readonly metadata: ResourceMetadata;

  protected abstract load(context: ExecutionContext): Promise<TOutput>;

  public async read(context: ExecutionContext): Promise<ResourceResult<TOutput>> {
    const startTime = Date.now();
    const uri = this.metadata.uri;

    for (const scope of this.metadata.requiredScopes) {
      if (!context.permissions.hasScope(scope)) {
        auditLogger.recordSecurityViolation(context, 'RESOURCE_SCOPE_UNAUTHORIZED', { uri, scope });
        throw new UnauthorizedError(scope);
      }
    }

    const cacheKey = `resource:${uri}`;
    const ttl = this.metadata.cacheTtlSeconds ?? 120;

    const cached = await cacheManager.get<TOutput>(
      context.tenant.tenantId,
      context.company.companyId,
      cacheKey,
    );
    if (cached !== null) {
      return {
        uri,
        mimeType: this.metadata.mimeType ?? 'application/json',
        content: cached,
        metadata: {
          durationMs: Date.now() - startTime,
          cached: true,
          tenantId: context.tenant.tenantId,
        },
      };
    }

    const content = await this.load(context);
    await cacheManager.set(
      context.tenant.tenantId,
      context.company.companyId,
      cacheKey,
      content,
      ttl,
    );

    auditLogger.logEvent({
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      eventType: 'resource_read',
      tenantId: context.tenant.tenantId,
      userId: context.user.userId,
      companyId: context.company.companyId,
      target: uri,
      status: 'success',
      durationMs: Date.now() - startTime,
    });

    return {
      uri,
      mimeType: this.metadata.mimeType ?? 'application/json',
      content,
      metadata: {
        durationMs: Date.now() - startTime,
        cached: false,
        tenantId: context.tenant.tenantId,
      },
    };
  }
}
