import { z } from 'zod';
import { BaseTool } from './base/tool.js';
import { CompanyService, CompanyDto } from '../services/company.service.js';
import { ExecutionContext } from '../types/context.js';
import { ToolMetadata } from '../types/mcp.js';
import { PermissionScopes } from '../types/roles.js';

export class SearchCompanyTool extends BaseTool<{ query: string }, CompanyDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'search_company',
    description: 'Search company legal entities managed within the tenant.',
    category: 'Companies',
    requiredScopes: [PermissionScopes.COMPANIES_READ],
    cacheTtlSeconds: 120,
  };

  public override readonly inputSchema = z.object({
    query: z.string().min(1),
  });

  protected override async handle(
    _input: { query: string },
    context: ExecutionContext,
  ): Promise<CompanyDto[]> {
    return CompanyService.list(context);
  }
}

export class GetCompanyTool extends BaseTool<{ id: string }, CompanyDto> {
  public override readonly metadata: ToolMetadata = {
    name: 'get_company',
    description: 'Get full profile, tax data, SDI code, and PEC of a company.',
    category: 'Companies',
    requiredScopes: [PermissionScopes.COMPANIES_READ],
    cacheTtlSeconds: 120,
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
  });

  protected override async handle(
    _input: { id: string },
    context: ExecutionContext,
  ): Promise<CompanyDto> {
    return CompanyService.getProfile(context);
  }
}

export class CreateCompanyTool extends BaseTool<
  {
    legalName: string;
    taxId: string;
    vatNumber: string;
    address: string;
    city: string;
    pec?: string;
    sdiCode?: string;
  },
  CompanyDto
> {
  public override readonly metadata: ToolMetadata = {
    name: 'create_company',
    description: 'Register a new legal company profile in tenant.',
    category: 'Companies',
    requiredScopes: [PermissionScopes.COMPANIES_WRITE],
  };

  public override readonly inputSchema = z.object({
    legalName: z.string().min(1),
    taxId: z.string().min(1),
    vatNumber: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    pec: z.string().email().optional(),
    sdiCode: z.string().optional(),
  });

  protected override async handle(input: z.infer<typeof this.inputSchema>): Promise<CompanyDto> {
    return {
      id: `comp_${Date.now()}`,
      country: 'IT',
      currency: 'EUR',
      isMain: false,
      ...input,
    };
  }
}

export class UpdateCompanyTool extends BaseTool<
  { id: string; legalName?: string; pec?: string },
  CompanyDto
> {
  public override readonly metadata: ToolMetadata = {
    name: 'update_company',
    description: 'Update company profile information.',
    category: 'Companies',
    requiredScopes: [PermissionScopes.COMPANIES_WRITE],
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
    legalName: z.string().optional(),
    pec: z.string().email().optional(),
  });

  protected override async handle(
    _input: { id: string; legalName?: string; pec?: string },
    context: ExecutionContext,
  ): Promise<CompanyDto> {
    return CompanyService.getProfile(context);
  }
}

export class ListCompaniesTool extends BaseTool<{ limit?: number }, CompanyDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'list_companies',
    description: 'List all companies registered under the tenant.',
    category: 'Companies',
    requiredScopes: [PermissionScopes.COMPANIES_READ],
    cacheTtlSeconds: 120,
  };

  public override readonly inputSchema = z.object({
    limit: z.number().int().optional().default(20),
  });

  protected override async handle(
    _input: { limit?: number },
    context: ExecutionContext,
  ): Promise<CompanyDto[]> {
    return CompanyService.list(context);
  }
}

// Contacts tools
export interface ContactDto {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
}

export class SearchContactTool extends BaseTool<{ query: string }, ContactDto[]> {
  public override readonly metadata: ToolMetadata = {
    name: 'search_contact',
    description: 'Search customer contacts, referents, and billing managers.',
    category: 'Contacts',
    requiredScopes: [PermissionScopes.CONTACTS_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    query: z.string().min(1),
  });

  protected override async handle(_input: { query: string }): Promise<ContactDto[]> {
    return [
      {
        id: 'cnt_1',
        customerId: 'cust_101',
        firstName: 'Mario',
        lastName: 'Rossi',
        email: 'm.rossi@acme.it',
        phone: '+39 02 1234567',
        role: 'Responsabile Acquisti',
      },
    ];
  }
}

export class GetContactTool extends BaseTool<{ id: string }, ContactDto | null> {
  public override readonly metadata: ToolMetadata = {
    name: 'get_contact',
    description: 'Get contact person details by ID.',
    category: 'Contacts',
    requiredScopes: [PermissionScopes.CONTACTS_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
  });

  protected override async handle(input: { id: string }): Promise<ContactDto | null> {
    return {
      id: input.id,
      customerId: 'cust_101',
      firstName: 'Mario',
      lastName: 'Rossi',
      email: 'm.rossi@acme.it',
      phone: '+39 02 1234567',
      role: 'Responsabile Acquisti',
    };
  }
}

export class CreateContactTool extends BaseTool<
  {
    customerId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role?: string;
  },
  ContactDto
> {
  public override readonly metadata: ToolMetadata = {
    name: 'create_contact',
    description: 'Add a new contact to a customer profile.',
    category: 'Contacts',
    requiredScopes: [PermissionScopes.CONTACTS_WRITE],
  };

  public override readonly inputSchema = z.object({
    customerId: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    role: z.string().optional(),
  });

  protected override async handle(input: z.infer<typeof this.inputSchema>): Promise<ContactDto> {
    return {
      id: `cnt_${Date.now()}`,
      ...input,
    };
  }
}

export class UpdateContactTool extends BaseTool<
  { id: string; email?: string; phone?: string },
  ContactDto | null
> {
  public override readonly metadata: ToolMetadata = {
    name: 'update_contact',
    description: 'Update customer contact info.',
    category: 'Contacts',
    requiredScopes: [PermissionScopes.CONTACTS_WRITE],
  };

  public override readonly inputSchema = z.object({
    id: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  });

  protected override async handle(input: {
    id: string;
    email?: string;
    phone?: string;
  }): Promise<ContactDto | null> {
    return {
      id: input.id,
      customerId: 'cust_101',
      firstName: 'Mario',
      lastName: 'Rossi',
      email: input.email ?? 'm.rossi@acme.it',
      phone: input.phone ?? '+39 02 1234567',
    };
  }
}

export class ListContactsTool extends BaseTool<
  { customerId?: string; limit?: number },
  ContactDto[]
> {
  public override readonly metadata: ToolMetadata = {
    name: 'list_contacts',
    description: 'List contacts for a specific customer or all recent contacts.',
    category: 'Contacts',
    requiredScopes: [PermissionScopes.CONTACTS_READ],
    cacheTtlSeconds: 60,
  };

  public override readonly inputSchema = z.object({
    customerId: z.string().optional(),
    limit: z.number().int().optional().default(20),
  });

  protected override async handle(input: {
    customerId?: string;
    limit?: number;
  }): Promise<ContactDto[]> {
    return [
      {
        id: 'cnt_1',
        customerId: input.customerId ?? 'cust_101',
        firstName: 'Mario',
        lastName: 'Rossi',
        email: 'm.rossi@acme.it',
        phone: '+39 02 1234567',
        role: 'Responsabile Acquisti',
      },
    ];
  }
}
