import { FatturaFacileMcpServer } from './server/mcp-server.js';
import { auditLogger } from './audit/logger.js';

async function bootstrap(): Promise<void> {
  const mcpServer = new FatturaFacileMcpServer();

  const shutdown = async (signal: string) => {
    auditLogger.logEvent({
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      eventType: 'tool_invocation',
      tenantId: 'system',
      userId: 'system',
      companyId: 'system',
      target: 'server.shutdown',
      status: 'success',
      metadata: { signal },
    });
    await mcpServer.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await mcpServer.start();
  } catch (err: unknown) {
    auditLogger.recordSecurityViolation(undefined, 'SERVER_BOOTSTRAP_FAILED', {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}

void bootstrap();
