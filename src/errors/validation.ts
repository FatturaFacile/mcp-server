import { BaseError } from './base.js';

export class ValidationError extends BaseError {
  public override readonly code = 'VALIDATION_FAILED';
  public readonly validationErrors: unknown;

  constructor(message: string, validationErrors?: unknown) {
    super(message, { validationErrors });
    this.validationErrors = validationErrors;
  }
}
