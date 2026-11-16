import { z } from 'zod';
import { BaseTool } from './base/tool.js';
import { CustomerService, CustomerDto } from '../services/customer.service.js';
import { ExecutionContext } from '../types/context.js';
import { ToolMetadata } from '../types/mcp.js';
import { PermissionScopes } from '../types/roles.js';

export class SearchCustomerTool extends BaseTool<{ query: string }, CustomerDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'search_customer',
    description:
      'Search ERP customers by name, tax ID (codice fiscale), VAT number (partita IVA), or email.',
    category: 'Customers',
    requiredScopes: [PermissionScopes.CUSTOMERS_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    query: z.string().min(1, 'Search query cannot be empty'),
  });

  protected override async handle(
    input: { query: string },
    context: ExecutionContext,
  ): Promise<CustomerDto[]> {
    return CustomerService.search(input.query, context);
  }
}

export class GetCustomerTool extends BaseTool<{ id: string }, CustomerDto | null> {
  public override readonly metadata: ToolMetadata = {
    name: 'get_customer',
    description: 'Retrieve detailed information for a specific customer by ID.',
    category: 'Customers',
    requiredScopes: [PermissionScopes.CUSTOMERS_READ],
    cacheTtlSeconds: 120,
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1, 'Customer ID is required'),
  });

  protected override async handle(
    input: { id: string },
    context: ExecutionContext,
  ): Promise<CustomerDto | null> {
    return CustomerService.getById(input.id, context);
  }
}

export class CreateCustomerTool extends BaseTool<
  {
    name: string;
    taxId: string;
    email: string;
    vatNumber?: string;
    phone?: string;
    address?: string;
    city?: string;
    zipCode?: string;
    country?: string;
  },
  CustomerDto
> {
  public override readonly metadata: ToolMetadata = {
    name: 'create_customer',
    description: 'Create a new customer profile in the ERP with fiscal and contact details.',
    category: 'Customers',
    requiredScopes: [PermissionScopes.CUSTOMERS_WRITE],
  };

  public override readonly inputSchema = z.object({
    name: z.string().min(1, 'Customer legal name is required'),
    taxId: z.string().min(1, 'Tax ID / Codice Fiscale is required'),
    email: z.string().email('Valid email is required'),
    vatNumber: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default('IT'),
  });

  protected override async handle(
    input: z.infer<typeof this.inputSchema>,
    context: ExecutionContext,
  ): Promise<CustomerDto> {
    return CustomerService.create(input, context);
  }
}

export class UpdateCustomerTool extends BaseTool<
  {
    id: string;
    name?: string;
    taxId?: string;
    email?: string;
    phone?: string;
    address?: string;
  },
  CustomerDto
> {
  public override readonly metadata: ToolMetadata = {
    name: 'update_customer',
    description: 'Update existing customer details in the ERP.',
    category: 'Customers',
    requiredScopes: [PermissionScopes.CUSTOMERS_WRITE],
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1, 'Customer ID is required'),
    name: z.string().optional(),
    taxId: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  });

  protected override async handle(
    input: z.infer<typeof this.inputSchema>,
    context: ExecutionContext,
  ): Promise<CustomerDto> {
    const { id, ...data } = input;
    return CustomerService.update(id, data, context);
  }
}

export class DeleteCustomerTool extends BaseTool<{ id: string }, { success: boolean; id: string }> {
  public override readonly metadata: ToolMetadata = {
    name: 'delete_customer',
    description: 'Delete or archive a customer profile from the ERP.',
    category: 'Customers',
    requiredScopes: [PermissionScopes.CUSTOMERS_DELETE],
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1, 'Customer ID is required'),
  });

  protected override async handle(
    input: { id: string },
    context: ExecutionContext,
  ): Promise<{ success: boolean; id: string }> {
    return CustomerService.delete(input.id, context);
  }
}

export class ListCustomersTool extends BaseTool<{ limit?: number }, CustomerDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'list_customers',
    description: 'List recent customers from the ERP with optional pagination limit.',
    category: 'Customers',
    requiredScopes: [PermissionScopes.CUSTOMERS_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    limit: z.number().int().min(1).max(100).default(20),
  });

  protected override async handle(
    input: { limit?: number },
    context: ExecutionContext,
  ): Promise<CustomerDto[]> {
    return CustomerService.list(input.limit, context);
  }
}
