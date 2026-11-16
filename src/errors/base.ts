/**
 * Base abstract error class for all domain and framework exceptions.
 */
export abstract class BaseError extends Error {
  public abstract readonly code: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown> | undefined;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    };
  }
}
