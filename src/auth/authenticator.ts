import { ExecutionContext, UserRole } from '../types/context.js';
import { RbacPermissionContext } from '../permissions/rbac.js';
import { AuthenticationError } from '../errors/auth.js';

export interface AuthCredentials {
  apiKey?: string | undefined;
  bearerToken?: string | undefined;
  tenantId?: string | undefined;
  companyId?: string | undefined;
}

export class Authenticator {
  public static async resolveContext(credentials: AuthCredentials): Promise<ExecutionContext> {
    const correlationId = crypto.randomUUID();

    // Default or resolved tenant
    const tenantId = credentials.tenantId || 'tenant-default';
    const companyId = credentials.companyId || 'company-main';

    let userId = 'system-agent';
    let role: UserRole = 'Agent';
    let email = 'agent@fatturafacile.eu';

    if (credentials.apiKey) {
      if (credentials.apiKey.startsWith('admin_')) {
        role = 'SuperAdministrator';
        userId = 'admin-user';
      } else if (credentials.apiKey.startsWith('org_')) {
        role = 'OrganizationAdministrator';
        userId = 'org-admin';
      } else if (credentials.apiKey.startsWith('ro_')) {
        role = 'ReadOnlyUser';
        userId = 'viewer';
      }
    } else if (credentials.bearerToken) {
      // Decode JWT token / mock token resolver
      userId = 'jwt-user';
      role = 'Manager';
    } else {
      // Fallback for local development or stdio without auth header
      role = 'Agent';
      userId = 'default-agent';
    }

    if (!tenantId) {
      throw new AuthenticationError('Tenant ID resolution failed');
    }

    const permissionContext = new RbacPermissionContext(role);

    return {
      correlationId,
      timestamp: new Date(),
      tenant: {
        tenantId,
        partitionKey: `part_${tenantId}`,
        isolationLevel: 'strict',
        features: ['invoicing', 'crm', 'accounting', 'quotes'],
      },
      user: {
        userId,
        email,
        role,
        groups: ['finance', 'operations'],
      },
      company: {
        companyId,
        legalName: 'Fattura Facile S.r.l.',
        taxId: 'IT12345678901',
        country: 'IT',
        currency: 'EUR',
      },
      permissions: permissionContext,
    };
  }
}
