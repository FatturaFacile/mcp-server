import { BaseError } from './base.js';

export class AuthenticationError extends BaseError {
  public override readonly code = 'AUTHENTICATION_REQUIRED';
}

export class UnauthorizedError extends BaseError {
  public override readonly code = 'PERMISSION_DENIED';
  public readonly requiredScope: string;

  constructor(requiredScope: string, message?: string) {
    super(message ?? `Permission denied: missing required scope '${requiredScope}'`, {
      requiredScope,
    });
    this.requiredScope = requiredScope;
  }
}

export class TenantAccessViolationError extends BaseError {
  public override readonly code = 'TENANT_ACCESS_VIOLATION';
  public readonly requestedTenantId: string;
  public readonly actualTenantId: string;

  constructor(requestedTenantId: string, actualTenantId: string, message?: string) {
    super(
      message ??
        `Tenant isolation violation: requested tenant '${requestedTenantId}' does not match active session '${actualTenantId}'`,
      { requestedTenantId, actualTenantId },
    );
    this.requestedTenantId = requestedTenantId;
    this.actualTenantId = actualTenantId;
  }
}
