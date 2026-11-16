import { describe, it, expect, beforeEach } from 'vitest';
import { SearchCustomerTool, CreateCustomerTool } from '../../src/tools/customers.js';
import { CreateInvoiceTool } from '../../src/tools/invoices.js';
import { CreateQuoteTool, ConvertQuoteToInvoiceTool } from '../../src/tools/quotes.js';
import { RegisterPaymentTool } from '../../src/tools/payments.js';
import { ExecutionContext } from '../../src/types/context.js';
import { RbacPermissionContext } from '../../src/permissions/rbac.js';

describe('MCP Domain Tools Execution Suite', () => {
  let context: ExecutionContext;

  beforeEach(() => {
    context = {
      correlationId: crypto.randomUUID(),
      timestamp: new Date(),
      tenant: {
        tenantId: 'tenant_testing',
        partitionKey: 'part_testing',
        isolationLevel: 'strict',
        features: ['invoicing', 'crm'],
      },
      user: {
        userId: 'usr_test_agent',
        email: 'agent@fatturafacile.eu',
        role: 'Agent',
        groups: ['sales'],
      },
      company: {
        companyId: 'comp_main',
        legalName: 'Fattura Facile S.r.l.',
        taxId: 'IT12345678901',
        country: 'IT',
        currency: 'EUR',
      },
      permissions: new RbacPermissionContext('Agent'),
    };
  });

  it('creates and searches customer using MCP tools', async () => {
    const createTool = new CreateCustomerTool();
    const searchTool = new SearchCustomerTool();

    const created = await createTool.execute(
      {
        name: 'Rossi Meccanica S.p.A.',
        taxId: 'IT09876543210',
        email: 'info@rossimeccanica.it',
      },
      context,
    );

    expect(created.success).toBe(true);
    expect(created.data?.name).toBe('Rossi Meccanica S.p.A.');

    const searchRes = await searchTool.execute({ query: 'Rossi' }, context);
    expect(searchRes.success).toBe(true);
    expect(searchRes.data?.length).toBeGreaterThan(0);
  });

  it('creates invoice with automated subtotal and VAT calculation', async () => {
    const invoiceTool = new CreateInvoiceTool();
    const result = await invoiceTool.execute(
      {
        customerId: 'cust_101',
        customerName: 'Acme Corporation S.r.l.',
        items: [
          {
            description: 'Sviluppo Modulo AI Gateway',
            quantity: 2,
            unitPrice: 1000,
            vatRate: 22,
          },
        ],
      },
      context,
    );

    expect(result.success).toBe(true);
    expect(result.data?.subtotal).toBe(2000);
    expect(result.data?.vatAmount).toBe(440);
    expect(result.data?.total).toBe(2440);
  });

  it('handles quote lifecycle and converts quote to invoice', async () => {
    const quoteTool = new CreateQuoteTool();
    const convertTool = new ConvertQuoteToInvoiceTool();

    const quoteRes = await quoteTool.execute(
      {
        customerId: 'cust_101',
        customerName: 'Acme Corporation S.r.l.',
        total: 5000,
      },
      context,
    );

    expect(quoteRes.success).toBe(true);
    const quoteId = quoteRes.data!.id;

    const convertRes = await convertTool.execute({ quoteId }, context);
    expect(convertRes.success).toBe(true);
    expect(convertRes.data?.invoiceId).toBeDefined();
  });

  it('registers payment against an invoice successfully', async () => {
    const paymentTool = new RegisterPaymentTool();
    const result = await paymentTool.execute(
      {
        invoiceId: 'inv_101',
        amount: 2440,
        paymentMethod: 'bank_transfer',
        reference: 'BONIFICO_SALDO_FATT_01',
      },
      context,
    );

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('completed');
  });
});
