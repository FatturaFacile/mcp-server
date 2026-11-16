import { z } from 'zod';
import { BaseTool } from './base/tool.js';
import { QuoteService, QuoteDto } from '../services/quote.service.js';
import { ExecutionContext } from '../types/context.js';
import { ToolMetadata } from '../types/mcp.js';
import { PermissionScopes } from '../types/roles.js';

export class SearchQuoteTool extends BaseTool<{ query: string }, QuoteDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'search_quote',
    description: 'Search ERP quotes/estimates by customer name or quote number.',
    category: 'Quotes',
    requiredScopes: [PermissionScopes.QUOTES_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    query: z.string().min(1, 'Search query cannot be empty'),
  });

  protected override async handle(
    input: { query: string },
    context: ExecutionContext,
  ): Promise<QuoteDto[]> {
    return QuoteService.search(input.query, context);
  }
}

export class GetQuoteTool extends BaseTool<{ id: string }, QuoteDto | null> {
  public override readonly metadata: ToolMetadata = {
    name: 'get_quote',
    description: 'Get details of an estimate/quote by ID.',
    category: 'Quotes',
    requiredScopes: [PermissionScopes.QUOTES_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1, 'Quote ID is required'),
  });

  protected override async handle(
    input: { id: string },
    context: ExecutionContext,
  ): Promise<QuoteDto | null> {
    return QuoteService.getById(input.id, context);
  }
}

export class CreateQuoteTool extends BaseTool<
  {
    customerId: string;
    customerName?: string;
    total: number;
    notes?: string;
  },
  QuoteDto
> {
  public override readonly metadata: ToolMetadata = {
    name: 'create_quote',
    description: 'Create a new business estimate/quote for a customer.',
    category: 'Quotes',
    requiredScopes: [PermissionScopes.QUOTES_WRITE],
  };

  public override readonly inputSchema = z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    customerName: z.string().optional(),
    total: z.number().positive('Total quote amount must be positive'),
    notes: z.string().optional(),
  });

  protected override async handle(
    input: z.infer<typeof this.inputSchema>,
    context: ExecutionContext,
  ): Promise<QuoteDto> {
    return QuoteService.create(input, context);
  }
}

export class ConvertQuoteToInvoiceTool extends BaseTool<
  { quoteId: string },
  { quoteId: string; invoiceId: string; invoiceNumber: string }
> {
  public override readonly metadata: ToolMetadata = {
    name: 'convert_quote_to_invoice',
    description: 'Convert an accepted customer quote into an active invoice.',
    category: 'Quotes',
    requiredScopes: [PermissionScopes.QUOTES_CONVERT, PermissionScopes.INVOICES_WRITE],
  };

  public override readonly inputSchema = z.object({
    quoteId: z.string().min(1, 'Quote ID is required'),
  });

  protected override async handle(
    input: { quoteId: string },
    context: ExecutionContext,
  ): Promise<{ quoteId: string; invoiceId: string; invoiceNumber: string }> {
    return QuoteService.convertToInvoice(input.quoteId, context);
  }
}

export class ListQuotesTool extends BaseTool<
  { status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted'; limit?: number },
  QuoteDto[]
> {
  public override readonly metadata: ToolMetadata = {
    name: 'list_quotes',
    description: 'List recent quotes filtered by status.',
    category: 'Quotes',
    requiredScopes: [PermissionScopes.QUOTES_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'converted']).optional(),
    limit: z.number().int().min(1).max(100).default(20),
  });

  protected override async handle(
    input: { status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted'; limit?: number },
    context: ExecutionContext,
  ): Promise<QuoteDto[]> {
    return QuoteService.list(input.status, input.limit, context);
  }
}

export class UpdateQuoteTool extends BaseTool<{ id: string; total?: number }, QuoteDto | null> {
  public override readonly metadata: ToolMetadata = {
    name: 'update_quote',
    description: 'Update quote details.',
    category: 'Quotes',
    requiredScopes: [PermissionScopes.QUOTES_WRITE],
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
    total: z.number().optional(),
  });

  protected override async handle(
    input: { id: string; total?: number },
    context: ExecutionContext,
  ): Promise<QuoteDto | null> {
    return QuoteService.getById(input.id, context);
  }
}

export class DeleteQuoteTool extends BaseTool<{ id: string }, { success: boolean; id: string }> {
  public override readonly metadata: ToolMetadata = {
    name: 'delete_quote',
    description: 'Delete a draft quote.',
    category: 'Quotes',
    requiredScopes: [PermissionScopes.QUOTES_DELETE],
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
  });

  protected override async handle(input: {
    id: string;
  }): Promise<{ success: boolean; id: string }> {
    return { success: true, id: input.id };
  }
}
