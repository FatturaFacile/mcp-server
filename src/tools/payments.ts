import { z } from 'zod';
import { BaseTool } from './base/tool.js';
import { PaymentService, PaymentDto } from '../services/payment.service.js';
import { ExecutionContext } from '../types/context.js';
import { ToolMetadata } from '../types/mcp.js';
import { PermissionScopes } from '../types/roles.js';

export class RegisterPaymentTool extends BaseTool<
  {
    invoiceId: string;
    amount: number;
    paymentMethod: 'bank_transfer' | 'credit_card' | 'direct_debit' | 'cash';
    reference?: string;
  },
  PaymentDto
> {
  public override readonly metadata: ToolMetadata = {
    name: 'register_payment',
    description: 'Register a payment received for an invoice and update invoice balance.',
    category: 'Payments',
    requiredScopes: [PermissionScopes.PAYMENTS_WRITE],
  };

  public override readonly inputSchema = z.object({
    invoiceId: z.string().min(1, 'Invoice ID is required'),
    amount: z.number().positive('Payment amount must be positive'),
    paymentMethod: z.enum(['bank_transfer', 'credit_card', 'direct_debit', 'cash']),
    reference: z.string().optional(),
  });

  protected override async handle(
    input: z.infer<typeof this.inputSchema>,
    context: ExecutionContext,
  ): Promise<PaymentDto> {
    return PaymentService.register(input, context);
  }
}

export class RefundPaymentTool extends BaseTool<
  { paymentId: string; reason?: string },
  { paymentId: string; status: string; refundedAt: string }
> {
  public override readonly metadata: ToolMetadata = {
    name: 'refund_payment',
    description: 'Process a refund for a previously registered payment.',
    category: 'Payments',
    requiredScopes: [PermissionScopes.PAYMENTS_WRITE],
  };

  public override readonly inputSchema = z.object({
    paymentId: z.string().min(1, 'Payment ID is required'),
    reason: z.string().optional(),
  });

  protected override async handle(
    input: { paymentId: string; reason?: string },
    context: ExecutionContext,
  ): Promise<{ paymentId: string; status: string; refundedAt: string }> {
    return PaymentService.refund(input.paymentId, input.reason, context);
  }
}

export class ListPaymentsTool extends BaseTool<{ limit?: number }, PaymentDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'list_payments',
    description: 'List recent incoming payments and transactions.',
    category: 'Payments',
    requiredScopes: [PermissionScopes.PAYMENTS_READ],
    cacheTtlSeconds: 30,
  };

  public override readonly inputSchema = z.object({
    limit: z.number().int().min(1).max(100).default(20),
  });

  protected override async handle(
    input: { limit?: number },
    context: ExecutionContext,
  ): Promise<PaymentDto[]> {
    return PaymentService.list(input.limit, context);
  }
}

export class SearchPaymentTool extends BaseTool<{ query: string }, PaymentDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'search_payment',
    description: 'Search payments by transaction reference or invoice ID.',
    category: 'Payments',
    requiredScopes: [PermissionScopes.PAYMENTS_READ],
    cacheTtlSeconds: 30,
  };

  public override readonly inputSchema = z.object({
    query: z.string().min(1),
  });

  protected override async handle(
    _input: { query: string },
    context: ExecutionContext,
  ): Promise<PaymentDto[]> {
    return PaymentService.list(20, context);
  }
}
