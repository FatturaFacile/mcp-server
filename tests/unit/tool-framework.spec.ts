import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { BaseTool } from '../../src/tools/base/tool.js';
import { ExecutionContext } from '../../src/types/context.js';
import { ToolMetadata } from '../../src/types/mcp.js';
import { RbacPermissionContext } from '../../src/permissions/rbac.js';

class MockTestTool extends BaseTool<
  { value: string; count?: number | undefined },
  { echo: string; count: number }
> {
  public override readonly metadata: ToolMetadata = {
    name: 'mock_test_tool',
    description: 'Mock tool for framework testing',
    category: 'Testing',
    requiredScopes: ['test:read'],
    cacheTtlSeconds: 10,
  };

  public override readonly inputSchema = z.object({
    value: z.string().min(3),
    count: z.number().int().optional().default(1),
  });

  protected override async handle(
    input: { value: string; count?: number | undefined },
    _context: ExecutionContext,
  ): Promise<{ echo: string; count: number }> {
    return {
      echo: `Processed: ${input.value}`,
      count: input.count ?? 1,
    };
  }
}

describe('BaseTool Execution Framework', () => {
  let tool: MockTestTool;
  let validContext: ExecutionContext;

  beforeEach(() => {
    tool = new MockTestTool();
    validContext = {
      correlationId: 'corr_123',
      timestamp: new Date(),
      tenant: {
        tenantId: 'tenant_alpha',
        partitionKey: 'part_alpha',
        isolationLevel: 'strict',
        features: ['testing'],
      },
      user: {
        userId: 'usr_123',
        email: 'test@fatturafacile.eu',
        role: 'Manager',
        groups: ['testers'],
      },
      company: {
        companyId: 'comp_456',
        legalName: 'Test Company S.r.l.',
        taxId: 'IT00000000000',
        country: 'IT',
        currency: 'EUR',
      },
      permissions: new RbacPermissionContext('Manager', ['test:read']),
    };
  });

  it('successfully validates input and executes tool logic', async () => {
    const result = await tool.execute({ value: 'hello world', count: 5 }, validContext);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      echo: 'Processed: hello world',
      count: 5,
    });
    expect(result.metadata?.cached).toBe(false);
  });

  it('rejects input that violates Zod schema', async () => {
    // value has only 2 characters, min is 3
    const result = await tool.execute({ value: 'ab' }, validContext);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_FAILED');
  });

  it('denies execution when user lacks required permission scope', async () => {
    const unauthorizedContext: ExecutionContext = {
      ...validContext,
      permissions: new RbacPermissionContext('ReadOnlyUser', []), // lacks 'test:read'
    };

    const result = await tool.execute({ value: 'authorized attempt' }, unauthorizedContext);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('PERMISSION_DENIED');
  });

  it('serves cached results on second execution with same input', async () => {
    const input = { value: 'caching-test', count: 2 };

    const firstRun = await tool.execute(input, validContext);
    expect(firstRun.success).toBe(true);
    expect(firstRun.metadata?.cached).toBe(false);

    const secondRun = await tool.execute(input, validContext);
    expect(secondRun.success).toBe(true);
    expect(secondRun.metadata?.cached).toBe(true);
    expect(secondRun.data).toEqual(firstRun.data);
  });
});
