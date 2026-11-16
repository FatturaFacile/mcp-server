import { z } from 'zod';
import { BaseTool } from './base/tool.js';
import { ProductService, ProductDto } from '../services/product.service.js';
import { ExecutionContext } from '../types/context.js';
import { ToolMetadata } from '../types/mcp.js';
import { PermissionScopes } from '../types/roles.js';

export class SearchProductTool extends BaseTool<{ query: string }, ProductDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'search_product',
    description: 'Search ERP physical catalog products by name, SKU/code, or category.',
    category: 'Products',
    requiredScopes: [PermissionScopes.PRODUCTS_READ],
    cacheTtlSeconds: 120,
  };

  public override readonly inputSchema = z.object({
    query: z.string().min(1, 'Search query cannot be empty'),
  });

  protected override async handle(
    input: { query: string },
    context: ExecutionContext,
  ): Promise<ProductDto[]> {
    return ProductService.search(input.query, 'product', context);
  }
}

export class GetProductTool extends BaseTool<{ id: string }, ProductDto | null> {
  public override readonly metadata: ToolMetadata = {
    name: 'get_product',
    description: 'Get product details, stock, price, and VAT rate by ID.',
    category: 'Products',
    requiredScopes: [PermissionScopes.PRODUCTS_READ],
    cacheTtlSeconds: 120,
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
  });

  protected override async handle(
    input: { id: string },
    context: ExecutionContext,
  ): Promise<ProductDto | null> {
    return ProductService.getById(input.id, context);
  }
}

export class CreateProductTool extends BaseTool<
  {
    name: string;
    code?: string;
    price: number;
    vatRate?: number;
    category?: string;
  },
  ProductDto
> {
  public override readonly metadata: ToolMetadata = {
    name: 'create_product',
    description: 'Add a new product to the ERP inventory catalog.',
    category: 'Products',
    requiredScopes: [PermissionScopes.PRODUCTS_WRITE],
  };

  public override readonly inputSchema = z.object({
    name: z.string().min(1),
    code: z.string().optional(),
    price: z.number().nonnegative(),
    vatRate: z.number().nonnegative().default(22),
    category: z.string().default('Generale'),
  });

  protected override async handle(
    input: z.infer<typeof this.inputSchema>,
    context: ExecutionContext,
  ): Promise<ProductDto> {
    return ProductService.create({ ...input, type: 'product' }, context);
  }
}

export class UpdateProductTool extends BaseTool<
  { id: string; price?: number; name?: string },
  ProductDto | null
> {
  public override readonly metadata: ToolMetadata = {
    name: 'update_product',
    description: 'Update product information or pricing in catalog.',
    category: 'Products',
    requiredScopes: [PermissionScopes.PRODUCTS_WRITE],
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
    price: z.number().optional(),
    name: z.string().optional(),
  });

  protected override async handle(
    input: { id: string; price?: number; name?: string },
    context: ExecutionContext,
  ): Promise<ProductDto | null> {
    return ProductService.getById(input.id, context);
  }
}

export class ListProductsTool extends BaseTool<{ limit?: number }, ProductDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'list_products',
    description: 'List products in inventory catalog.',
    category: 'Products',
    requiredScopes: [PermissionScopes.PRODUCTS_READ],
    cacheTtlSeconds: 120,
  };

  public override readonly inputSchema = z.object({
    limit: z.number().int().min(1).max(100).default(20),
  });

  protected override async handle(
    input: { limit?: number },
    context: ExecutionContext,
  ): Promise<ProductDto[]> {
    return ProductService.list('product', input.limit, context);
  }
}

// Services Tools
export class SearchServiceTool extends BaseTool<{ query: string }, ProductDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'search_service',
    description: 'Search professional services, consultancies, and hourly rates in ERP catalog.',
    category: 'Services',
    requiredScopes: [PermissionScopes.SERVICES_READ],
    cacheTtlSeconds: 120,
  };

  public override readonly inputSchema = z.object({
    query: z.string().min(1),
  });

  protected override async handle(
    input: { query: string },
    context: ExecutionContext,
  ): Promise<ProductDto[]> {
    return ProductService.search(input.query, 'service', context);
  }
}

export class GetServiceTool extends BaseTool<{ id: string }, ProductDto | null> {
  public override readonly metadata: ToolMetadata = {
    name: 'get_service',
    description: 'Get details of a specific service from the catalog.',
    category: 'Services',
    requiredScopes: [PermissionScopes.SERVICES_READ],
    cacheTtlSeconds: 120,
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
  });

  protected override async handle(
    input: { id: string },
    context: ExecutionContext,
  ): Promise<ProductDto | null> {
    return ProductService.getById(input.id, context);
  }
}

export class CreateServiceTool extends BaseTool<
  {
    name: string;
    code?: string;
    price: number;
    vatRate?: number;
    category?: string;
  },
  ProductDto
> {
  public override readonly metadata: ToolMetadata = {
    name: 'create_service',
    description: 'Define a new professional service item in ERP.',
    category: 'Services',
    requiredScopes: [PermissionScopes.SERVICES_WRITE],
  };

  public override readonly inputSchema = z.object({
    name: z.string().min(1),
    code: z.string().optional(),
    price: z.number().nonnegative(),
    vatRate: z.number().nonnegative().default(22),
    category: z.string().default('Servizi'),
  });

  protected override async handle(
    input: z.infer<typeof this.inputSchema>,
    context: ExecutionContext,
  ): Promise<ProductDto> {
    return ProductService.create({ ...input, type: 'service' }, context);
  }
}

export class UpdateServiceTool extends BaseTool<
  { id: string; price?: number; name?: string },
  ProductDto | null
> {
  public override readonly metadata: ToolMetadata = {
    name: 'update_service',
    description: 'Update service pricing or details.',
    category: 'Services',
    requiredScopes: [PermissionScopes.SERVICES_WRITE],
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
    price: z.number().optional(),
    name: z.string().optional(),
  });

  protected override async handle(
    input: { id: string; price?: number; name?: string },
    context: ExecutionContext,
  ): Promise<ProductDto | null> {
    return ProductService.getById(input.id, context);
  }
}

export class ListServicesTool extends BaseTool<{ limit?: number }, ProductDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'list_services',
    description: 'List professional services in catalog.',
    category: 'Services',
    requiredScopes: [PermissionScopes.SERVICES_READ],
    cacheTtlSeconds: 120,
  };

  public override readonly inputSchema = z.object({
    limit: z.number().int().min(1).max(100).default(20),
  });

  protected override async handle(
    input: { limit?: number },
    context: ExecutionContext,
  ): Promise<ProductDto[]> {
    return ProductService.list('service', input.limit, context);
  }
}
