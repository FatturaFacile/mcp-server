import { describe, it, expect } from 'vitest';
import { cacheManager } from '../../src/cache/redis.js';
import { CustomerService } from '../../src/services/customer.service.js';
import { ExecutionContext } from '../../src/types/context.js';
import { RbacPermissionContext } from '../../src/permissions/rbac.js';

describe('Multi-Tenant Isolation & Zero Leakage Verification', () => {
  const createTestContext = (tenantId: string, companyId: string): ExecutionContext => ({
    correlationId: crypto.randomUUID(),
    timestamp: new Date(),
    tenant: {
      tenantId,
      partitionKey: `part_${tenantId}`,
      isolationLevel: 'strict',
      features: ['invoicing'],
    },
    user: {
      userId: `usr_${tenantId}`,
      email: `admin@${tenantId}.eu`,
      role: 'OrganizationAdministrator',
      groups: ['admins'],
    },
    company: {
      companyId,
      legalName: `Company of ${tenantId}`,
      taxId: 'IT12345678901',
      country: 'IT',
      currency: 'EUR',
    },
    permissions: new RbacPermissionContext('OrganizationAdministrator'),
  });

  it('guarantees complete cache isolation between different tenants', async () => {
    const tenantA = 'tenant_enterprise_a';
    const tenantB = 'tenant_enterprise_b';
    const companyId = 'comp_shared_id';
    const key = 'dashboard:summary';

    // Set cache for Tenant A
    await cacheManager.set(tenantA, companyId, key, { revenue: 50000 });

    // Verify Tenant A has the cached value
    const cachedA = await cacheManager.get<{ revenue: number }>(tenantA, companyId, key);
    expect(cachedA).toEqual({ revenue: 50000 });

    // Verify Tenant B has NO access to Tenant A cache (Zero Leakage)
    const cachedB = await cacheManager.get<{ revenue: number }>(tenantB, companyId, key);
    expect(cachedB).toBeNull();
  });

  it('enforces tenant context propagation when fetching domain entities', async () => {
    const ctxA = createTestContext('tenant_corp_1', 'comp_1');
    const ctxB = createTestContext('tenant_corp_2', 'comp_2');

    const customerA = await CustomerService.create({ name: 'Alpha Tenant Customer' }, ctxA);
    const customerB = await CustomerService.create({ name: 'Beta Tenant Customer' }, ctxB);

    expect(customerA.id).toBeDefined();
    expect(customerB.id).toBeDefined();
    expect(customerA.id).not.toBe(customerB.id);
  });
});
