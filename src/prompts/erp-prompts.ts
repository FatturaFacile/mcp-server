import { z } from 'zod';
import { BasePrompt, PromptMessage } from './base/prompt.js';
import { PromptMetadata } from '../types/mcp.js';
import { ExecutionContext } from '../types/context.js';

// ==========================================
// SALES PROMPTS
// ==========================================
export class CreateQuotePrompt extends BasePrompt<{ customerName: string; projectScope: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'CreateQuotePrompt',
    description:
      'Assist in drafting a structured, legally compliant quote for a client based on project scope.',
    category: 'Sales',
    arguments: [
      { name: 'customerName', description: 'Name of the prospective client', required: true },
      {
        name: 'projectScope',
        description: 'Details of the requested products or services',
        required: true,
      },
    ],
  };

  public override readonly schema = z.object({
    customerName: z.string().min(1),
    projectScope: z.string().min(1),
  });

  protected override async buildMessages(
    args: { customerName: string; projectScope: string },
    context: ExecutionContext,
  ): Promise<PromptMessage[]> {
    return [
      {
        role: 'system',
        content: `You are a Senior Sales Engineer at ${context.company.legalName} (Tax ID: ${context.company.taxId}). Prepare a formal commercial estimate/quote in ${context.company.currency}. Include itemized line items, valid payment terms (default 30 days net), and standard validity of 30 days.`,
      },
      {
        role: 'user',
        content: `Generate a detailed quotation for customer "${args.customerName}" for the following scope of work: "${args.projectScope}". Use the create_quote or search_product tools if catalog items are referenced.`,
      },
    ];
  }
}

export class CreateInvoicePrompt extends BasePrompt<{ customerId: string; invoiceItems: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'CreateInvoicePrompt',
    description:
      'Guide the agent to generate an invoice from customer ID and line items with appropriate VAT rates.',
    category: 'Sales',
    arguments: [
      { name: 'customerId', description: 'Customer identifier in ERP', required: true },
      {
        name: 'invoiceItems',
        description: 'Description, quantity, and unit prices',
        required: true,
      },
    ],
  };

  public override readonly schema = z.object({
    customerId: z.string().min(1),
    invoiceItems: z.string().min(1),
  });

  protected override async buildMessages(
    args: { customerId: string; invoiceItems: string },
    context: ExecutionContext,
  ): Promise<PromptMessage[]> {
    return [
      {
        role: 'system',
        content: `You are the billing assistant for ${context.company.legalName}. You verify VAT compliance (22% standard in Italy, or specific exemptions).`,
      },
      {
        role: 'user',
        content: `Prepare and validate invoice draft for customer ID "${args.customerId}" with line items: "${args.invoiceItems}". Calculate subtotal, VAT, and total.`,
      },
    ];
  }
}

export class SendInvoicePrompt extends BasePrompt<{
  invoiceNumber: string;
  recipientEmail?: string;
}> {
  public override readonly metadata: PromptMetadata = {
    name: 'SendInvoicePrompt',
    description: 'Generate an executive cover message for sending an invoice to a customer.',
    category: 'Sales',
    arguments: [
      {
        name: 'invoiceNumber',
        description: 'Invoice number identifier (e.g., FATT-2026-001)',
        required: true,
      },
      { name: 'recipientEmail', description: 'Target email address', required: false },
    ],
  };

  public override readonly schema = z.object({
    invoiceNumber: z.string().min(1),
    recipientEmail: z.string().email().optional(),
  });

  protected override async buildMessages(
    args: { invoiceNumber: string; recipientEmail?: string },
    context: ExecutionContext,
  ): Promise<PromptMessage[]> {
    return [
      {
        role: 'system',
        content: `You are an accounts receivable communicator representing ${context.company.legalName}.`,
      },
      {
        role: 'user',
        content: `Draft a professional email transmitting invoice ${args.invoiceNumber} to ${args.recipientEmail ?? 'the client finance office'}, detailing payment instructions and due date.`,
      },
    ];
  }
}

export class InvoiceReminderPrompt extends BasePrompt<{
  invoiceNumber: string;
  daysOverdue: string;
}> {
  public override readonly metadata: PromptMetadata = {
    name: 'InvoiceReminderPrompt',
    description: 'Draft courteous yet firm payment reminders for overdue invoices.',
    category: 'Sales',
    arguments: [
      { name: 'invoiceNumber', description: 'Invoice number', required: true },
      { name: 'daysOverdue', description: 'Number of days past due date', required: true },
    ],
  };

  public override readonly schema = z.object({
    invoiceNumber: z.string().min(1),
    daysOverdue: z.string().min(1),
  });

  protected override async buildMessages(
    args: { invoiceNumber: string; daysOverdue: string },
    context: ExecutionContext,
  ): Promise<PromptMessage[]> {
    return [
      {
        role: 'system',
        content: `You are credit collection officer for ${context.company.legalName}. Keep the tone polite, professional, and clear.`,
      },
      {
        role: 'user',
        content: `Draft a reminder notice for invoice ${args.invoiceNumber}, which is ${args.daysOverdue} days past due. Provide IBAN payment instructions.`,
      },
    ];
  }
}

export class SalesSummaryPrompt extends BasePrompt<{ period?: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'SalesSummaryPrompt',
    description: 'Summarize sales performance, deals closed, and revenue generated over a period.',
    category: 'Sales',
  };

  public override readonly schema = z.object({
    period: z.string().optional(),
  });

  protected override async buildMessages(args: { period?: string }): Promise<PromptMessage[]> {
    return [
      {
        role: 'system',
        content: 'You are a Head of Sales AI Analyst. Analyze closed invoices and accepted quotes.',
      },
      {
        role: 'user',
        content: `Analyze the sales figures for period: ${args.period ?? 'current month'}. Read the dashboard://sales resource and invoice://paid to generate your analysis.`,
      },
    ];
  }
}

export class SalesForecastPrompt extends BasePrompt<{ timeframeMonths?: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'SalesForecastPrompt',
    description: 'Forecast upcoming sales based on active quotes and historical conversion rates.',
    category: 'Sales',
  };

  public override readonly schema = z.object({
    timeframeMonths: z.string().optional(),
  });

  protected override async buildMessages(args: {
    timeframeMonths?: string;
  }): Promise<PromptMessage[]> {
    return [
      {
        role: 'system',
        content: 'You are an enterprise financial predictive modeling assistant.',
      },
      {
        role: 'user',
        content: `Forecast revenue for the next ${args.timeframeMonths ?? '3'} months based on quote://recent and historical trends.`,
      },
    ];
  }
}

export class RevenueAnalysisPrompt extends BasePrompt<{ year?: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'RevenueAnalysisPrompt',
    description: 'Provide breakdown of revenue by product category, customer segment, and month.',
    category: 'Sales',
  };

  public override readonly schema = z.object({
    year: z.string().optional(),
  });

  protected override async buildMessages(args: { year?: string }): Promise<PromptMessage[]> {
    return [
      {
        role: 'system',
        content: 'You are a Business Intelligence specialist examining revenue composition.',
      },
      {
        role: 'user',
        content: `Perform revenue breakdown for year ${args.year ?? '2026'}. Identify top performing categories and growth drivers.`,
      },
    ];
  }
}

// ==========================================
// CUSTOMER PROMPTS
// ==========================================
export class CustomerLookupPrompt extends BasePrompt<{ query: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'CustomerLookupPrompt',
    description:
      'Comprehensive 360-degree overview of a customer profile, active orders, and balances.',
    category: 'Customers',
    arguments: [
      { name: 'query', description: 'Customer search keyword, tax ID or name', required: true },
    ],
  };

  public override readonly schema = z.object({ query: z.string().min(1) });

  protected override async buildMessages(args: { query: string }): Promise<PromptMessage[]> {
    return [
      { role: 'system', content: 'You are an ERP CRM specialist.' },
      {
        role: 'user',
        content: `Lookup customer "${args.query}", inspect their recent invoices, active quotes, and overall credit status.`,
      },
    ];
  }
}

export class CustomerAnalysisPrompt extends BasePrompt<{ customerId: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'CustomerAnalysisPrompt',
    description: 'Analyze buying patterns, average order value, and lifetime value for a customer.',
    category: 'Customers',
    arguments: [{ name: 'customerId', description: 'Customer ID', required: true }],
  };

  public override readonly schema = z.object({ customerId: z.string().min(1) });

  protected override async buildMessages(args: { customerId: string }): Promise<PromptMessage[]> {
    return [
      { role: 'system', content: 'You are a Customer Success and Account Value Analyst.' },
      {
        role: 'user',
        content: `Analyze the purchasing cadence and historical invoice volume for customer ID: ${args.customerId}.`,
      },
    ];
  }
}

export class CustomerRiskPrompt extends BasePrompt<{ customerId: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'CustomerRiskPrompt',
    description: 'Assess credit risk, overdue history, and payment delays for a customer.',
    category: 'Customers',
    arguments: [{ name: 'customerId', description: 'Customer ID', required: true }],
  };

  public override readonly schema = z.object({ customerId: z.string().min(1) });

  protected override async buildMessages(args: { customerId: string }): Promise<PromptMessage[]> {
    return [
      { role: 'system', content: 'You are a Credit Risk Officer.' },
      {
        role: 'user',
        content: `Evaluate credit risk for customer ${args.customerId}. Check for overdue invoices and calculate average days to pay.`,
      },
    ];
  }
}

export class CustomerHealthPrompt extends BasePrompt<{ customerId: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'CustomerHealthPrompt',
    description:
      'Evaluate overall relationship health score based on interactions and ticket volumes.',
    category: 'Customers',
    arguments: [{ name: 'customerId', description: 'Customer ID', required: true }],
  };

  public override readonly schema = z.object({ customerId: z.string().min(1) });

  protected override async buildMessages(args: { customerId: string }): Promise<PromptMessage[]> {
    return [
      { role: 'system', content: 'You are a Customer Relationship Intelligence Analyst.' },
      {
        role: 'user',
        content: `Generate a health score card (0-100) for customer ${args.customerId} highlighting retention probability and upsell readiness.`,
      },
    ];
  }
}

// ==========================================
// FINANCE PROMPTS
// ==========================================
export class FinancialOverviewPrompt extends BasePrompt<{ quarter?: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'FinancialOverviewPrompt',
    description:
      'Comprehensive financial health report summarizing P&L, balance sheet indicators, and working capital.',
    category: 'Finance',
  };

  public override readonly schema = z.object({ quarter: z.string().optional() });

  protected override async buildMessages(args: { quarter?: string }): Promise<PromptMessage[]> {
    return [
      { role: 'system', content: 'You are Chief Financial Officer (CFO) AI Advisor.' },
      {
        role: 'user',
        content: `Provide an executive financial overview for ${args.quarter ?? 'current quarter'} using dashboard://summary and dashboard://cashflow.`,
      },
    ];
  }
}

export class CashFlowPrompt extends BasePrompt<{ projectionWeeks?: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'CashFlowPrompt',
    description: 'Analyze liquidity, expected receivables, and upcoming operational payables.',
    category: 'Finance',
  };

  public override readonly schema = z.object({ projectionWeeks: z.string().optional() });

  protected override async buildMessages(args: {
    projectionWeeks?: string;
  }): Promise<PromptMessage[]> {
    return [
      { role: 'system', content: 'You are a Corporate Treasury Specialist.' },
      {
        role: 'user',
        content: `Examine the cashflow trend over the next ${args.projectionWeeks ?? '12'} weeks using dashboard://cashflow.`,
      },
    ];
  }
}

export class ProfitabilityPrompt extends BasePrompt<{ productOrService?: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'ProfitabilityPrompt',
    description: 'Examine margin per product line or project.',
    category: 'Finance',
  };

  public override readonly schema = z.object({ productOrService: z.string().optional() });

  protected override async buildMessages(args: {
    productOrService?: string;
  }): Promise<PromptMessage[]> {
    return [
      { role: 'system', content: 'You are a Management Control and Margin Analyst.' },
      {
        role: 'user',
        content: `Analyze profitability and gross margins for: ${args.productOrService ?? 'all main revenue streams'}.`,
      },
    ];
  }
}

export class OverdueInvoicesPrompt extends BasePrompt<{ minAmount?: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'OverdueInvoicesPrompt',
    description: 'Audit all overdue receivables and recommend immediate recovery actions.',
    category: 'Finance',
  };

  public override readonly schema = z.object({ minAmount: z.string().optional() });

  protected override async buildMessages(args: { minAmount?: string }): Promise<PromptMessage[]> {
    return [
      { role: 'system', content: 'You are Senior Credit Control Advisor.' },
      {
        role: 'user',
        content: `List all invoices from invoice://overdue exceeding ${args.minAmount ?? '0'} EUR and draft a recovery prioritization plan.`,
      },
    ];
  }
}

export class RevenueForecastPrompt extends BasePrompt<{ horizon?: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'RevenueForecastPrompt',
    description: 'Long-term statistical revenue modeling for annual budgets.',
    category: 'Finance',
  };

  public override readonly schema = z.object({ horizon: z.string().optional() });

  protected override async buildMessages(args: { horizon?: string }): Promise<PromptMessage[]> {
    return [
      { role: 'system', content: 'You are a Strategic Financial Planning Specialist.' },
      {
        role: 'user',
        content: `Construct a revenue trajectory forecast for the horizon: ${args.horizon ?? 'Fiscal Year 2026'}.`,
      },
    ];
  }
}

// ==========================================
// PRODUCTIVITY PROMPTS
// ==========================================
export class DailySummaryPrompt extends BasePrompt {
  public override readonly metadata: PromptMetadata = {
    name: 'DailySummaryPrompt',
    description: 'Daily briefing with invoices issued, payments received, and open urgent tasks.',
    category: 'Productivity',
  };

  public override readonly schema = z.object({});

  protected override async buildMessages(
    _args: unknown,
    context: ExecutionContext,
  ): Promise<PromptMessage[]> {
    return [
      {
        role: 'system',
        content: `Daily ERP briefing for ${context.user.email} (${context.user.role}).`,
      },
      {
        role: 'user',
        content:
          "Summarize today's business operations: new quotes, registered payments, and critical alerts.",
      },
    ];
  }
}

export class WeeklySummaryPrompt extends BasePrompt {
  public override readonly metadata: PromptMetadata = {
    name: 'WeeklySummaryPrompt',
    description: 'Weekly digest of revenue generated, invoices sent, and collections reconciled.',
    category: 'Productivity',
  };

  public override readonly schema = z.object({});

  protected override async buildMessages(): Promise<PromptMessage[]> {
    return [
      { role: 'system', content: 'Weekly Executive Briefing Analyst.' },
      {
        role: 'user',
        content: 'Synthesize the weekly throughput across Invoices, Quotes, and Payments.',
      },
    ];
  }
}

export class ManagementReportPrompt extends BasePrompt<{ focusArea?: string }> {
  public override readonly metadata: PromptMetadata = {
    name: 'ManagementReportPrompt',
    description: 'Targeted management report for department heads.',
    category: 'Productivity',
  };

  public override readonly schema = z.object({ focusArea: z.string().optional() });

  protected override async buildMessages(args: { focusArea?: string }): Promise<PromptMessage[]> {
    return [
      { role: 'system', content: 'Departmental Management Consultant.' },
      {
        role: 'user',
        content: `Prepare a management report focused on: ${args.focusArea ?? 'Operations and Cash Generation'}.`,
      },
    ];
  }
}

export class ExecutiveReportPrompt extends BasePrompt {
  public override readonly metadata: PromptMetadata = {
    name: 'ExecutiveReportPrompt',
    description:
      'Board-level executive briefing with high-level KPI trends and strategic recommendations.',
    category: 'Productivity',
  };

  public override readonly schema = z.object({});

  protected override async buildMessages(
    _args: unknown,
    context: ExecutionContext,
  ): Promise<PromptMessage[]> {
    return [
      { role: 'system', content: `Boardroom AI Advisor for ${context.company.legalName}.` },
      {
        role: 'user',
        content:
          'Generate a Board Executive Report covering Q1 financials, cash liquidity, pipeline strength, and credit risks.',
      },
    ];
  }
}

export function getAllPrompts(): BasePrompt<any>[] {
  return [
    // Sales
    new CreateQuotePrompt(),
    new CreateInvoicePrompt(),
    new SendInvoicePrompt(),
    new InvoiceReminderPrompt(),
    new SalesSummaryPrompt(),
    new SalesForecastPrompt(),
    new RevenueAnalysisPrompt(),

    // Customers
    new CustomerLookupPrompt(),
    new CustomerAnalysisPrompt(),
    new CustomerRiskPrompt(),
    new CustomerHealthPrompt(),

    // Finance
    new FinancialOverviewPrompt(),
    new CashFlowPrompt(),
    new ProfitabilityPrompt(),
    new OverdueInvoicesPrompt(),
    new RevenueForecastPrompt(),

    // Productivity
    new DailySummaryPrompt(),
    new WeeklySummaryPrompt(),
    new ManagementReportPrompt(),
    new ExecutiveReportPrompt(),
  ];
}
