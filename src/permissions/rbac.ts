import { PermissionContext, UserRole } from '../types/context.js';
import { RoleScopeMatrix } from '../types/roles.js';
import { UnauthorizedError } from '../errors/auth.js';

export class RbacPermissionContext implements PermissionContext {
  public readonly scopes: readonly string[];
  public readonly isSuperAdmin: boolean;

  constructor(role: UserRole, customScopes: readonly string[] = []) {
    this.isSuperAdmin = role === 'SuperAdministrator';
    const roleScopes = RoleScopeMatrix[role] ?? [];
    const merged = new Set([...roleScopes, ...customScopes]);
    this.scopes = Array.from(merged);
  }

  public hasScope(requiredScope: string): boolean {
    if (this.isSuperAdmin) return true;
    if (this.scopes.includes('*')) return true;
    if (this.scopes.includes(requiredScope)) return true;

    // Check wildcard prefix (e.g. 'invoices:*' satisfies 'invoices:read')
    const [domain] = requiredScope.split(':');
    if (domain && this.scopes.includes(`${domain}:*`)) {
      return true;
    }

    return false;
  }

  public assertScope(requiredScope: string): void {
    if (!this.hasScope(requiredScope)) {
      throw new UnauthorizedError(requiredScope);
    }
  }
}
