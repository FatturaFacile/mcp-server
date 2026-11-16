import { BaseError } from './base.js';

export class ErpIntegrationError extends BaseError {
  public override readonly code = 'ERP_INTEGRATION_ERROR';
  public readonly statusCode?: number | undefined;
  public readonly endpoint?: string | undefined;

  constructor(
    message: string,
    statusCode?: number,
    endpoint?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, { ...context, statusCode, endpoint });
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}
