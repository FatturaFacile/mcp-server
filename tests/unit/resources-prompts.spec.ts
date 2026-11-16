import { describe, it, expect } from 'vitest';
import { getAllResources } from '../../src/resources/erp-resources.js';
import { getAllPrompts } from '../../src/prompts/erp-prompts.js';
import { ExecutionContext } from '../../src/types/context.js';
import { RbacPermissionContext } from '../../src/permissions/rbac.js';

describe('MCP Resources & Prompts Verification Suite', () => {
  const context: ExecutionContext = {
    correlationId: crypto.randomUUID(),
    timestamp: new Date(),
    tenant: {
      tenantId: 'tenant_testing',
      partitionKey: 'part_testing',
      isolationLevel: 'strict',
      features: ['invoicing', 'crm', 'analytics'],
    },
    user: {
      userId: 'usr_admin',
      email: 'admin@fatturafacile.eu',
      role: 'SuperAdministrator',
      groups: ['admins'],
    },
    company: {
      companyId: 'comp_main',
      legalName: 'Fattura Facile S.r.l.',
      taxId: 'IT12345678901',
      country: 'IT',
      currency: 'EUR',
    },
    permissions: new RbacPermissionContext('SuperAdministrator'),
  };

  it('instantiates all resources and verifies metadata integrity', () => {
    const resources = getAllResources();
    expect(resources.length).toBeGreaterThanOrEqual(20);

    for (const res of resources) {
      expect(res.metadata.uri).toBeDefined();
      expect(res.metadata.name).toBeDefined();
      expect(res.metadata.requiredScopes).toBeDefined();
    }
  });

  it('reads dynamic company profile resource successfully', async () => {
    const resources = getAllResources();
    const profileRes = resources.find((r) => r.metadata.uri === 'company://profile');
    expect(profileRes).toBeDefined();

    const result = await profileRes!.read(context);
    expect(result.uri).toBe('company://profile');
    expect((result.content as any).legalName).toBe('Fattura Facile S.r.l.');
  });

  it('instantiates all prompts and renders messages without failure', async () => {
    const prompts = getAllPrompts();
    expect(prompts.length).toBeGreaterThanOrEqual(15);

    const quotePrompt = prompts.find((p) => p.metadata.name === 'CreateQuotePrompt');
    expect(quotePrompt).toBeDefined();

    const messages = await quotePrompt!.render(
      { customerName: 'Acme Corp', projectScope: 'Cloud Invoicing Setup' },
      context,
    );
    expect(messages).toHaveLength(2);
    expect(messages[0]!.role).toBe('system');
    expect(messages[1]!.role).toBe('user');
  });
});
