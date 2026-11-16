import pino from 'pino';
import { ExecutionContext } from '../types/context.js';
import { config } from '../config/environment.js';

export interface AuditEvent {
  readonly eventId: string;
  readonly timestamp: string;
  readonly eventType:
    'tool_invocation' | 'resource_read' | 'prompt_render' | 'workflow_step' | 'security_violation';
  readonly tenantId: string;
  readonly userId: string;
  readonly companyId: string;
  readonly target: string;
  readonly status: 'success' | 'failure' | 'denied';
  readonly durationMs?: number | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

class AuditLoggerService {
  private readonly logger: pino.Logger;

  constructor() {
    this.logger = pino({
      level: config.LOG_LEVEL,
      base: { service: config.OTEL_SERVICE_NAME },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  public logEvent(event: AuditEvent): void {
    this.logger.info(
      { audit: event },
      `[AUDIT] ${event.eventType} on ${event.target}: ${event.status}`,
    );
  }

  public recordToolExecution(
    context: ExecutionContext,
    toolName: string,
    status: 'success' | 'failure',
    durationMs: number,
    metadata?: Record<string, unknown>,
  ): void {
    this.logEvent({
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      eventType: 'tool_invocation',
      tenantId: context.tenant.tenantId,
      userId: context.user.userId,
      companyId: context.company.companyId,
      target: toolName,
      status,
      durationMs,
      metadata,
    });
  }

  public recordSecurityViolation(
    context: Partial<ExecutionContext> | undefined,
    violationType: string,
    details: Record<string, unknown>,
  ): void {
    this.logger.warn(
      {
        securityViolation: {
          violationType,
          tenantId: context?.tenant?.tenantId ?? 'unknown',
          userId: context?.user?.userId ?? 'unknown',
          companyId: context?.company?.companyId ?? 'unknown',
          details,
          timestamp: new Date().toISOString(),
        },
      },
      `[SECURITY] Violation detected: ${violationType}`,
    );
  }
}

export const auditLogger = new AuditLoggerService();
