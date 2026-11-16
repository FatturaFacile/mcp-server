import { z } from 'zod';
import { ITool, ToolMetadata, ToolResult } from '../../types/mcp.js';
import { ExecutionContext } from '../../types/context.js';
import { telemetry } from '../../telemetry/tracer.js';
import { auditLogger } from '../../audit/logger.js';
import { cacheManager } from '../../cache/redis.js';
import { rateLimiter } from '../../security/rate-limiter.js';
import { DataSanitizer } from '../../security/sanitizer.js';
import { ValidationError } from '../../errors/validation.js';
import { McpProtocolError, McpErrorCode } from '../../errors/mcp.js';
import { UnauthorizedError } from '../../errors/auth.js';

export abstract class BaseTool<TInput = any, TOutput = unknown> implements ITool<TInput, TOutput> {
  public abstract readonly metadata: ToolMetadata;
  public abstract readonly inputSchema: z.ZodType<TInput, any, any>;

  /**
   * Implement the core business logic inside this method.
   */
  protected abstract handle(input: TInput, context: ExecutionContext): Promise<TOutput>;

  /**
   * Reusable tool execution framework lifecycle.
   */
  public async execute(rawInput: unknown, context: ExecutionContext): Promise<ToolResult<TOutput>> {
    const startTime = Date.now();
    const toolName = this.metadata.name;

    return telemetry.startActiveSpan(
      `mcp.tool.${toolName}`,
      {
        'mcp.tool.name': toolName,
        'tenant.id': context.tenant.tenantId,
        'company.id': context.company.companyId,
        'user.id': context.user.userId,
      },
      async (span) => {
        try {
          // 1. Rate Limiting Check
          const rateCheck = rateLimiter.checkLimit(context.tenant.tenantId, context.user.userId);
          if (!rateCheck.allowed) {
            auditLogger.recordSecurityViolation(context, 'RATE_LIMIT_EXCEEDED', { toolName });
            throw new McpProtocolError(
              `Rate limit exceeded for tool ${toolName}`,
              McpErrorCode.RATE_LIMITED,
            );
          }

          // 2. Authorization / Scope Verification
          for (const requiredScope of this.metadata.requiredScopes) {
            if (!context.permissions.hasScope(requiredScope)) {
              auditLogger.recordSecurityViolation(context, 'SCOPE_UNAUTHORIZED', {
                toolName,
                requiredScope,
              });
              throw new UnauthorizedError(requiredScope);
            }
          }

          // 3. Zod Input Schema Validation & Sanitization
          const parseResult = this.inputSchema.safeParse(rawInput);
          if (!parseResult.success) {
            const formatted = parseResult.error.format();
            auditLogger.recordSecurityViolation(context, 'SCHEMA_VALIDATION_FAILED', {
              toolName,
              errors: formatted,
            });
            throw new ValidationError(`Input validation failed for tool ${toolName}`, formatted);
          }
          const validatedInput = parseResult.data;

          // 4. Multi-Tenant Cache Check (if tool is read-only and defines cache TTL)
          let cacheKey: string | null = null;
          if (this.metadata.cacheTtlSeconds && this.metadata.cacheTtlSeconds > 0) {
            cacheKey = `tool:${toolName}:${JSON.stringify(validatedInput)}`;
            const cachedResult = await cacheManager.get<TOutput>(
              context.tenant.tenantId,
              context.company.companyId,
              cacheKey,
            );
            if (cachedResult !== null) {
              const durationMs = Date.now() - startTime;
              span.setAttribute('cache.hit', true);
              auditLogger.recordToolExecution(context, toolName, 'success', durationMs, {
                cached: true,
              });
              return {
                success: true,
                data: cachedResult,
                metadata: {
                  durationMs,
                  cached: true,
                  tenantId: context.tenant.tenantId,
                },
              };
            }
          }

          // 5. Execution with Exponential Backoff Retry Policy
          const result = await this.executeWithRetry(() => this.handle(validatedInput, context), 3);

          // 6. Output Sanitization
          const sanitizedResult = DataSanitizer.sanitizeObject(result);

          // 7. Cache population
          if (cacheKey && this.metadata.cacheTtlSeconds) {
            await cacheManager.set(
              context.tenant.tenantId,
              context.company.companyId,
              cacheKey,
              sanitizedResult,
              this.metadata.cacheTtlSeconds,
            );
          }

          const durationMs = Date.now() - startTime;
          auditLogger.recordToolExecution(context, toolName, 'success', durationMs);

          return {
            success: true,
            data: sanitizedResult,
            metadata: {
              durationMs,
              cached: false,
              tenantId: context.tenant.tenantId,
            },
          };
        } catch (err: unknown) {
          const durationMs = Date.now() - startTime;
          auditLogger.recordToolExecution(context, toolName, 'failure', durationMs, {
            error: String(err),
          });

          if (err instanceof UnauthorizedError) {
            return {
              success: false,
              error: {
                code: err.code,
                message: err.message,
                details: { requiredScope: err.requiredScope },
              },
            };
          }

          if (err instanceof ValidationError) {
            return {
              success: false,
              error: {
                code: err.code,
                message: err.message,
                details: err.validationErrors,
              },
            };
          }

          if (err instanceof McpProtocolError) {
            return {
              success: false,
              error: {
                code: err.code,
                message: err.message,
                details: err.context,
              },
            };
          }

          return {
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: err instanceof Error ? err.message : String(err),
            },
          };
        }
      },
    );
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let attempt = 0;
    let delay = 100;

    while (attempt < maxRetries) {
      try {
        return await fn();
      } catch (err: unknown) {
        attempt++;
        if (attempt >= maxRetries) {
          throw err;
        }
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      }
    }

    throw new Error('Retry exhausted');
  }
}
