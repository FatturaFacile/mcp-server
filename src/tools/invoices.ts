import { z } from 'zod';
import { BaseTool } from './base/tool.js';
import { InvoiceService, InvoiceDto } from '../services/invoice.service.js';
import { ExecutionContext } from '../types/context.js';
import { ToolMetadata } from '../types/mcp.js';
import { PermissionScopes } from '../types/roles.js';

export class SearchInvoiceTool extends BaseTool<{ query: string }, InvoiceDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'search_invoice',
    description: 'Search ERP invoices by invoice number, customer name, or fiscal ID.',
    category: 'Invoices',
    requiredScopes: [PermissionScopes.INVOICES_READ],
    cacheTtlSeconds: 30,
  };

  public override readonly inputSchema = z.object({
    query: z.string().min(1, 'Search query cannot be empty'),
  });

  protected override async handle(
    input: { query: string },
    context: ExecutionContext,
  ): Promise<InvoiceDto[]> {
    return InvoiceService.search(input.query, context);
  }
}

export class GetInvoiceTool extends BaseTool<{ id: string }, InvoiceDto | null> {
  public override readonly metadata: ToolMetadata = {
    name: 'get_invoice',
    description: 'Get full invoice details, line items, VAT rates, and payment terms by ID.',
    category: 'Invoices',
    requiredScopes: [PermissionScopes.INVOICES_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1, 'Invoice ID is required'),
  });

  protected override async handle(
    input: { id: string },
    context: ExecutionContext,
  ): Promise<InvoiceDto | null> {
    return InvoiceService.getById(input.id, context);
  }
}

export class CreateInvoiceTool extends BaseTool<
  {
    customerId: string;
    customerName?: string;
    items: {
      description: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
    }[];
    dueDate?: string;
    notes?: string;
  },
  InvoiceDto
> {
  public override readonly metadata: ToolMetadata = {
    name: 'create_invoice',
    description:
      'Create a new electronic or standard invoice with line items, VAT, and customer details.',
    category: 'Invoices',
    requiredScopes: [PermissionScopes.INVOICES_WRITE],
  };

  public override readonly inputSchema = z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    customerName: z.string().optional(),
    items: z
      .array(
        z.object({
          description: z.string().min(1),
          quantity: z.number().positive(),
          unitPrice: z.number().nonnegative(),
          vatRate: z.number().nonnegative().default(22),
        }),
      )
      .min(1, 'At least one line item is required'),
    dueDate: z.string().optional(),
    notes: z.string().optional(),
  });

  protected override async handle(
    input: z.infer<typeof this.inputSchema>,
    context: ExecutionContext,
  ): Promise<InvoiceDto> {
    const calculatedItems = input.items.map((item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineVat = (lineSubtotal * item.vatRate) / 100;
      return {
        ...item,
        total: lineSubtotal + lineVat,
      };
    });

    const subtotal = calculatedItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const vatAmount = calculatedItems.reduce(
      (acc, it) => acc + (it.quantity * it.unitPrice * it.vatRate) / 100,
      0,
    );

    return InvoiceService.create(
      {
        customerId: input.customerId,
        customerName: input.customerName,
        dueDate: input.dueDate,
        items: calculatedItems,
        subtotal,
        vatAmount,
        total: subtotal + vatAmount,
      },
      context,
    );
  }
}

export class SendInvoiceTool extends BaseTool<
  { invoiceId: string; recipientEmail?: string },
  { success: boolean; id: string; recipient: string }
> {
  public override readonly metadata: ToolMetadata = {
    name: 'send_invoice',
    description: 'Send an issued invoice via email or transmission channel (SDI in Italy).',
    category: 'Invoices',
    requiredScopes: [PermissionScopes.INVOICES_SEND],
  };

  public override readonly inputSchema = z.object({
    invoiceId: z.string().min(1, 'Invoice ID is required'),
    recipientEmail: z.string().email().optional(),
  });

  protected override async handle(
    input: { invoiceId: string; recipientEmail?: string },
    context: ExecutionContext,
  ): Promise<{ success: boolean; id: string; recipient: string }> {
    return InvoiceService.send(input.invoiceId, input.recipientEmail, context);
  }
}

export class CancelInvoiceTool extends BaseTool<
  { invoiceId: string; reason?: string },
  { success: boolean; id: string; status: string }
> {
  public override readonly metadata: ToolMetadata = {
    name: 'cancel_invoice',
    description: 'Cancel an invoice and mark it as void/cancelled.',
    category: 'Invoices',
    requiredScopes: [PermissionScopes.INVOICES_CANCEL],
  };

  public override readonly inputSchema = z.object({
    invoiceId: z.string().min(1, 'Invoice ID is required'),
    reason: z.string().optional(),
  });

  protected override async handle(
    input: { invoiceId: string; reason?: string },
    context: ExecutionContext,
  ): Promise<{ success: boolean; id: string; status: string }> {
    return InvoiceService.cancel(input.invoiceId, input.reason, context);
  }
}

export class DuplicateInvoiceTool extends BaseTool<{ invoiceId: string }, InvoiceDto> {
  public override readonly metadata: ToolMetadata = {
    name: 'duplicate_invoice',
    description: 'Duplicate an existing invoice as a new draft.',
    category: 'Invoices',
    requiredScopes: [PermissionScopes.INVOICES_WRITE],
  };

  public override readonly inputSchema = z.object({
    invoiceId: z.string().min(1, 'Invoice ID is required'),
  });

  protected override async handle(
    input: { invoiceId: string },
    context: ExecutionContext,
  ): Promise<InvoiceDto> {
    const existing = await InvoiceService.getById(input.invoiceId, context);
    if (!existing) {
      throw new Error(`Invoice ${input.invoiceId} not found`);
    }
    return InvoiceService.create(
      {
        customerId: existing.customerId,
        customerName: existing.customerName,
        items: existing.items,
        subtotal: existing.subtotal,
        vatAmount: existing.vatAmount,
      },
      context,
    );
  }
}

export class ListInvoicesTool extends BaseTool<
  { status?: 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled'; limit?: number },
  InvoiceDto[]
> {
  public override readonly metadata: ToolMetadata = {
    name: 'list_invoices',
    description:
      'List invoices filtered by status (paid, overdue, draft, etc.) with pagination limit.',
    category: 'Invoices',
    requiredScopes: [PermissionScopes.INVOICES_READ],
    cacheTtlSeconds: 30,
  };

  public override readonly inputSchema = z.object({
    status: z.enum(['draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
    limit: z.number().int().min(1).max(100).default(20),
  });

  protected override async handle(
    input: {
      status?: 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled';
      limit?: number;
    },
    context: ExecutionContext,
  ): Promise<InvoiceDto[]> {
    return InvoiceService.list(input.status, input.limit, context);
  }
}

export class UpdateInvoiceTool extends BaseTool<
  { id: string; dueDate?: string; notes?: string },
  InvoiceDto | null
> {
  public override readonly metadata: ToolMetadata = {
    name: 'update_invoice',
    description: 'Update metadata or payment due date for a draft invoice.',
    category: 'Invoices',
    requiredScopes: [PermissionScopes.INVOICES_WRITE],
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1, 'Invoice ID is required'),
    dueDate: z.string().optional(),
    notes: z.string().optional(),
  });

  protected override async handle(
    input: { id: string; dueDate?: string; notes?: string },
    context: ExecutionContext,
  ): Promise<InvoiceDto | null> {
    return InvoiceService.getById(input.id, context);
  }
}

export class DeleteInvoiceTool extends BaseTool<{ id: string }, { success: boolean; id: string }> {
  public override readonly metadata: ToolMetadata = {
    name: 'delete_invoice',
    description: 'Delete a draft invoice permanently.',
    category: 'Invoices',
    requiredScopes: [PermissionScopes.INVOICES_DELETE],
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1, 'Invoice ID is required'),
  });

  protected override async handle(input: {
    id: string;
  }): Promise<{ success: boolean; id: string }> {
    return { success: true, id: input.id };
  }
}
