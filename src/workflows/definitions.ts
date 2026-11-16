import { BaseWorkflowEngine } from './workflow-engine.js';
import { CustomerService } from '../services/customer.service.js';
import { QuoteService } from '../services/quote.service.js';
import { InvoiceService } from '../services/invoice.service.js';
import { DashboardService } from '../services/dashboard.service.js';
import { PermissionScopes } from '../types/roles.js';

// 1. Customer Onboarding & Quote Creation Workflow
export class CustomerOnboardingWorkflow extends BaseWorkflowEngine {
  constructor() {
    super(
      'customer-onboarding',
      'Customer Onboarding & Initial Quotation',
      'Registers a new client profile and automatically prepares their initial commercial quote.',
      [PermissionScopes.CUSTOMERS_WRITE, PermissionScopes.QUOTES_WRITE],
      [
        {
          name: 'register_customer',
          description: 'Register the customer legal entity',
          execute: async (input: any, ctx) => {
            const customer = await CustomerService.create(input.customer, ctx.executionContext);
            ctx.sharedData.customerId = customer.id;
            return customer;
          },
          compensate: async (_input, output, ctx) => {
            if (output?.id) {
              await CustomerService.delete(output.id, ctx.executionContext);
            }
          },
        },
        {
          name: 'generate_initial_quote',
          description: 'Draft the initial project quote',
          execute: async (customer: any, ctx) => {
            const initial = ctx.initialPayload as Record<string, unknown> | undefined;
            const amount = typeof initial?.quoteAmount === 'number' ? initial.quoteAmount : 2500;
            return QuoteService.create(
              {
                customerId: customer.id,
                customerName: customer.name,
                total: amount,
              },
              ctx.executionContext,
            );
          },
        },
      ],
    );
  }
}

// 2. Quote Conversion & Invoice Dispatch Workflow
export class QuoteConversionWorkflow extends BaseWorkflowEngine {
  constructor() {
    super(
      'quote-conversion',
      'Quote Conversion & Invoice Sending',
      'Converts an accepted quote to an invoice and dispatches it to client billing contact.',
      [
        PermissionScopes.QUOTES_CONVERT,
        PermissionScopes.INVOICES_WRITE,
        PermissionScopes.INVOICES_SEND,
      ],
      [
        {
          name: 'convert_quote',
          description: 'Convert accepted quote to invoice',
          execute: async (input: { quoteId: string }, ctx) => {
            return QuoteService.convertToInvoice(input.quoteId, ctx.executionContext);
          },
        },
        {
          name: 'dispatch_invoice',
          description: 'Send converted invoice to customer',
          execute: async (conversion: { invoiceId: string }, ctx) => {
            return InvoiceService.send(conversion.invoiceId, undefined, ctx.executionContext);
          },
          compensate: async (_input, output, ctx) => {
            if (output?.id) {
              await InvoiceService.cancel(
                output.id,
                'Workflow conversion cancelled',
                ctx.executionContext,
              );
            }
          },
        },
      ],
    );
  }
}

// 3. Overdue Invoice Recovery Workflow
export class OverdueInvoiceRecoveryWorkflow extends BaseWorkflowEngine {
  constructor() {
    super(
      'overdue-recovery',
      'Overdue Invoice Recovery & Dunning',
      'Scans for overdue receivables and drafts formal reminder notices.',
      [PermissionScopes.INVOICES_READ, PermissionScopes.INVOICES_SEND],
      [
        {
          name: 'detect_overdue',
          description: 'Find all overdue invoices',
          execute: async (_input, ctx) => {
            return InvoiceService.list('overdue', 50, ctx.executionContext);
          },
        },
        {
          name: 'send_reminders',
          description: 'Dispatch reminders to debtor accounts',
          execute: async (overdueList: any[], ctx) => {
            const results = [];
            for (const inv of overdueList) {
              const res = await InvoiceService.send(inv.id, undefined, ctx.executionContext);
              results.push(res);
            }
            return { processedCount: results.length, remindersSent: results };
          },
        },
      ],
    );
  }
}

// 4. Monthly Executive Report Workflow
export class MonthlyExecutiveReportWorkflow extends BaseWorkflowEngine {
  constructor() {
    super(
      'monthly-executive-report',
      'Monthly Executive Financial Report Generation',
      'Aggregates revenue, cashflow, and customer health for monthly board review.',
      [PermissionScopes.DASHBOARDS_READ, PermissionScopes.ANALYTICS_READ],
      [
        {
          name: 'collect_metrics',
          description: 'Gather summary indicators and liquidity trends',
          execute: async (_input, ctx) => {
            const summary = await DashboardService.getSummary(ctx.executionContext);
            const cashflow = await DashboardService.getCashFlow(ctx.executionContext);
            return { summary, cashflow, generatedAt: new Date().toISOString() };
          },
        },
      ],
    );
  }
}

export function getAllWorkflows(): BaseWorkflowEngine<any, any>[] {
  return [
    new CustomerOnboardingWorkflow(),
    new QuoteConversionWorkflow(),
    new OverdueInvoiceRecoveryWorkflow(),
    new MonthlyExecutiveReportWorkflow(),
  ];
}
