import { describe, it, expect } from 'vitest';
import {
  CustomerOnboardingWorkflow,
  QuoteConversionWorkflow,
} from '../../src/workflows/definitions.js';
import { ExecutionContext } from '../../src/types/context.js';
import { RbacPermissionContext } from '../../src/permissions/rbac.js';

describe('Workflow Engine & Transaction Orchestration Suite', () => {
  const context: ExecutionContext = {
    correlationId: crypto.randomUUID(),
    timestamp: new Date(),
    tenant: {
      tenantId: 'tenant_enterprise',
      partitionKey: 'part_enterprise',
      isolationLevel: 'strict',
      features: ['invoicing', 'crm', 'workflows'],
    },
    user: {
      userId: 'usr_ops',
      email: 'ops@fatturafacile.eu',
      role: 'Manager',
      groups: ['management'],
    },
    company: {
      companyId: 'comp_main',
      legalName: 'Fattura Facile S.r.l.',
      taxId: 'IT12345678901',
      country: 'IT',
      currency: 'EUR',
    },
    permissions: new RbacPermissionContext('Manager'),
  };

  it('successfully completes Customer Onboarding workflow with initial quote', async () => {
    const workflow = new CustomerOnboardingWorkflow();
    const result = await workflow.execute(
      {
        customer: {
          name: 'Nuova Azienda S.r.l.',
          taxId: 'IT55443322110',
          email: 'direzione@nuovaazienda.it',
        },
        quoteAmount: 4800,
      },
      context,
    );

    expect(result.status).toBe('completed');
    expect(result.executedSteps).toEqual(['register_customer', 'generate_initial_quote']);
    expect(result.compensatedSteps).toHaveLength(0);
    expect((result.output as any)?.total).toBe(4800);
  });

  it('converts quote to invoice and triggers dispatch', async () => {
    const workflow = new QuoteConversionWorkflow();
    const result = await workflow.execute(
      {
        quoteId: 'quo_test_123',
      },
      context,
    );

    expect(result.status).toBe('completed');
    expect(result.executedSteps).toContain('convert_quote');
    expect(result.executedSteps).toContain('dispatch_invoice');
  });
});
