/**
 * Context types for multi-tenant and secure execution in fatturafacile-mcp-server.
 */

export interface TenantContext {
  readonly tenantId: string;
  readonly partitionKey: string;
  readonly isolationLevel: 'strict' | 'shared';
  readonly features: readonly string[];
}

export type UserRole =
  | 'SuperAdministrator'
  | 'OrganizationAdministrator'
  | 'Manager'
  | 'Employee'
  | 'Agent'
  | 'ReadOnlyUser';

export interface UserContext {
  readonly userId: string;
  readonly email: string;
  readonly role: UserRole;
  readonly groups: readonly string[];
}

export interface CompanyContext {
  readonly companyId: string;
  readonly legalName: string;
  readonly taxId: string;
  readonly country: string;
  readonly currency: string;
}

export interface PermissionContext {
  readonly scopes: readonly string[];
  readonly isSuperAdmin: boolean;
  hasScope(scope: string): boolean;
  assertScope(scope: string): void;
}

export interface ExecutionContext {
  readonly correlationId: string;
  readonly tenant: TenantContext;
  readonly user: UserContext;
  readonly company: CompanyContext;
  readonly permissions: PermissionContext;
  readonly timestamp: Date;
}
